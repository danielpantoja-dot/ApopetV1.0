import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

const app = new Hono();

const createSupabaseClient = () => createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-8565c573/health", (c) => {
  return c.json({ status: "ok" });
});

// Sign up endpoint
app.post("/make-server-8565c573/signup", async (c) => {
  try {
    const { email, password, name, phone, location, avatar } = await c.req.json();
    
    if (!email || !password || !name) {
      return c.json({ error: "Email, password and name are required" }, 400);
    }

    const supabase = createSupabaseClient();
    
    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { 
        name,
        phone: phone || '',
        location: location || ''
      },
      email_confirm: true // Automatically confirm since email server isn't configured
    });

    if (authError) {
      console.log('Auth error during signup:', authError);
      return c.json({ error: `Auth error during signup: ${authError.message}` }, 400);
    }

    if (!authData.user) {
      return c.json({ error: "User creation failed" }, 400);
    }

    // Store user profile in Supabase Database
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert([{
        id: authData.user.id,
        name,
        email,
        phone: phone || '',
        location: location || 'Madrid, España',
        avatar_url: avatar || null
      }])
      .select()
      .single();

    if (profileError) {
      console.log('Error creating profile:', profileError);
      // Try to clean up the auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      return c.json({ error: `Error creating profile: ${profileError.message}` }, 500);
    }

    return c.json({ 
      message: "User created successfully",
      user: profileData,
      pet: null
    });

  } catch (error) {
    console.log('Server error during signup:', error);
    return c.json({ error: `Server error during signup: ${error.message}` }, 500);
  }
});

// Get user profile endpoint
app.get("/make-server-8565c573/profile/:userId", async (c) => {
  try {
    console.log('Getting profile for userId:', c.req.param('userId'));
    const userId = c.req.param('userId');
    const accessToken = c.req.header('Authorization')?.split(' ')[1];

    if (!accessToken) {
      console.log('No access token provided');
      return c.json({ error: 'Authorization header required' }, 401);
    }

    console.log('Verifying access token...');
    const supabase = createSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      console.log('Invalid token error:', error);
      return c.json({ error: 'Invalid token' }, 401);
    }

    console.log('Token verified for user:', user.id);

    // Get user profile from database
    console.log('Getting user profile from database...');
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    // If profile doesn't exist, create a basic one from auth metadata
    if (profileError || !userProfile) {
      console.log('Creating new user profile from auth metadata');
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert([{
          id: user.id,
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'Usuario',
          email: user.email || '',
          phone: user.user_metadata?.phone || '',
          location: user.user_metadata?.location || 'Madrid, España',
          avatar_url: user.user_metadata?.avatar || null
        }])
        .select()
        .single();
      
      if (createError) {
        console.log('Error creating profile:', createError);
        return c.json({ error: `Error creating profile: ${createError.message}` }, 500);
      }
      
      console.log('New user profile created');
      
      // Return new profile with no pet
      return c.json({ 
        user: newProfile,
        pet: null
      });
    }

    console.log('Existing user profile found');

    // Get pet profile from database
    console.log('Getting pet profile from database...');
    const { data: petProfile, error: petError } = await supabase
      .from('pets')
      .select('*')
      .eq('owner_id', userId)
      .single();
    
    console.log('Pet profile result:', petProfile ? 'found' : 'not found');

    console.log('Returning profile data');
    return c.json({ 
      user: userProfile,
      pet: petProfile || null
    });

  } catch (error) {
    console.log('Error getting profile:', error);
    return c.json({ error: `Error getting profile: ${error.message}` }, 500);
  }
});

// Update user profile endpoint
app.put("/make-server-8565c573/profile/:userId", async (c) => {
  try {
    const userId = c.req.param('userId');
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const updates = await c.req.json();

    if (!accessToken) {
      return c.json({ error: 'Authorization header required' }, 401);
    }

    const supabase = createSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user || user.id !== userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Update profile in database
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.log('Error updating profile:', updateError);
      return c.json({ error: `Error updating profile: ${updateError.message}` }, 500);
    }

    return c.json({ user: updatedProfile });

  } catch (error) {
    console.log('Error updating profile:', error);
    return c.json({ error: `Error updating profile: ${error.message}` }, 500);
  }
});

// Update pet profile endpoint
app.put("/make-server-8565c573/pet/:userId", async (c) => {
  try {
    const userId = c.req.param('userId');
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const updates = await c.req.json();

    if (!accessToken) {
      return c.json({ error: 'Authorization header required' }, 401);
    }

    const supabase = createSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user || user.id !== userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if pet exists
    const { data: existingPet } = await supabase
      .from('pets')
      .select('id')
      .eq('owner_id', userId)
      .single();

    let petData;

    if (existingPet) {
      // Update existing pet
      const { data: updatedPet, error: updateError } = await supabase
        .from('pets')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingPet.id)
        .select()
        .single();

      if (updateError) {
        console.log('Error updating pet:', updateError);
        return c.json({ error: `Error updating pet: ${updateError.message}` }, 500);
      }

      petData = updatedPet;
    } else {
      // Create new pet
      const { data: newPet, error: createError } = await supabase
        .from('pets')
        .insert([{
          owner_id: userId,
          likes: 0,
          ...updates
        }])
        .select()
        .single();

      if (createError) {
        console.log('Error creating pet:', createError);
        return c.json({ error: `Error creating pet: ${createError.message}` }, 500);
      }

      petData = newPet;
    }

    return c.json({ pet: petData });

  } catch (error) {
    console.log('Error updating pet:', error);
    return c.json({ error: `Error updating pet: ${error.message}` }, 500);
  }
});

Deno.serve(app.fetch);