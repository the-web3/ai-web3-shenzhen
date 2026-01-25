/* 
the api for ai dimsum devs.
*/
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.
import { Application, Router } from "oak";
import { oakCors } from "cors";
import { CSS, render } from "@deno/gfm";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://test.supabase.com";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "1234567890";
const supabase = createClient(supabaseUrl, supabaseKey);

console.log("");

const router = new Router();

router
.get("/", async (context) => {
  context.response.body = "Hello from AI DimSum RightProof!";
})
.get("/docs", async (context) =>{
  try {
    const readmeText = await Deno.readTextFile("./apidoc.md");
    context.response.body = readmeText;
  } catch (err) {
    console.error("Error reading README:", err);
    context.response.status = 500;
    context.response.body = { error: "Could not load documentation" };
  }
})
.get("/docs/html", async (context) => {
  try {
    // Read README.md file
    const readmeText = await Deno.readTextFile("./apidoc.md");
    
    // Render markdown to HTML with GFM styles
    const body = render(readmeText);
    
    // Create complete HTML document with GFM CSS
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DimSum RightProof API Documentation</title>
  <style>
    ${CSS}
    body {
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
    }
  </style>
</head>
<body>
${body}
</body>
</html>`;
    
    // Set response headers for HTML
    context.response.headers.set("Content-Type", "text/html; charset=utf-8");
    context.response.body = html;
  } catch (err) {
    console.error("Error reading README:", err);
    context.response.status = 500;
    context.response.body = { error: "Could not load documentation" };
  }
})
// GET all dataset_licences
.get("/dataset_licences", async (context) => {
  try {
    const { data, error } = await supabase
      .from("dataset_licences")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      context.response.status = 500;
      context.response.body = { error: error.message };
      return;
    }

    context.response.body = { data };
  } catch (err) {
    console.error("Error fetching dataset_licences:", err);
    context.response.status = 500;
    context.response.body = { error: "Could not fetch dataset_licences" };
  }
})
// GET single dataset_licence by id or unique_id
.get("/dataset_licences/:id", async (context) => {
  try {
    const id = context.params.id;
    
    // Check if id is a UUID (unique_id) or a number (id)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    
    const { data, error } = await supabase
      .from("dataset_licences")
      .select("*")
      .eq(isUUID ? "unique_id" : "id", id)
      .single();

    if (error) {
      context.response.status = 404;
      context.response.body = { error: "Dataset licence not found" };
      return;
    }

    context.response.body = { data };
  } catch (err) {
    console.error("Error fetching dataset_licence:", err);
    context.response.status = 500;
    context.response.body = { error: "Could not fetch dataset_licence" };
  }
})
// POST create new dataset_licence
.post("/dataset_licences", async (context) => {
  try {
    const body = await context.request.body({ type: "json" }).value;
    const { context: ctx, cantonese_categories_id, nft_id, name } = body;

    const { data, error } = await supabase
      .from("dataset_licences")
      .insert({
        name: name,
        context: ctx,
        cantonese_categories_id,
        nft_id,
      })
      .select()
      .single();

    if (error) {
      context.response.status = 500;
      context.response.body = { error: error.message };
      return;
    }

    context.response.status = 201;
    context.response.body = { data, message: "Dataset licence created successfully" };
  } catch (err) {
    console.error("Error creating dataset_licence:", err);
    context.response.status = 500;
    context.response.body = { error: "Could not create dataset_licence" };
  }
})
// PUT update dataset_licence by unique_id
.put("/dataset_licences/:unique_id", async (context) => {
  try {
    const unique_id = context.params.unique_id;
    const body = await context.request.body({ type: "json" }).value;
    const { context: ctx, cantonese_categories_id, nft_id } = body;

    const { data, error } = await supabase
      .from("dataset_licences")
      .update({
        context: ctx,
        cantonese_categories_id,
        nft_id,
      })
      .eq("unique_id", unique_id)
      .select()
      .single();

    if (error) {
      context.response.status = error.code === "PGRST116" ? 404 : 500;
      context.response.body = { error: error.code === "PGRST116" ? "Dataset licence not found" : error.message };
      return;
    }

    context.response.body = { data, message: "Dataset licence updated successfully" };
  } catch (err) {
    console.error("Error updating dataset_licence:", err);
    context.response.status = 500;
    context.response.body = { error: "Could not update dataset_licence" };
  }
})
// DELETE dataset_licence by id
.delete("/dataset_licences/:id", async (context) => {
  try {
    const id = context.params.id;

    const { error } = await supabase
      .from("dataset_licences")
      .delete()
      .eq("id", id);

    if (error) {
      context.response.status = 500;
      context.response.body = { error: error.message };
      return;
    }

    context.response.body = { message: "Dataset licence deleted successfully" };
  } catch (err) {
    console.error("Error deleting dataset_licence:", err);
    context.response.status = 500;
    context.response.body = { error: "Could not delete dataset_licence" };
  }
});

const app = new Application();

app.use(oakCors()); // Enable CORS for All Routes
app.use(router.routes());

console.info("CORS-enabled web server listening on port 8000");
await app.listen({ port: 8000 });
