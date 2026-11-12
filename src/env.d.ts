/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    /** Set by the middleware on on-demand CRM routes once Supabase is configured. */
    session?: import('./system/crm/supabase').Session;
  }
}
