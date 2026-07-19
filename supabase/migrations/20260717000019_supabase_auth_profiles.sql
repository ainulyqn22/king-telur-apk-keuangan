-- Connect Supabase Auth identities to the application authorization profile.
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
  INSERT INTO public.profiles(id,full_name,role,created_by,updated_by)
  VALUES(NEW.id,COALESCE(NEW.raw_user_meta_data->>'full_name',NEW.email),'User',NEW.id::text,NEW.id::text)
  ON CONFLICT(id) DO NOTHING;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- Backfill identities created before this migration. Assign elevated roles manually.
INSERT INTO public.profiles(id,full_name,role,created_by,updated_by)
SELECT id,COALESCE(raw_user_meta_data->>'full_name',email),'User',id::text,id::text FROM auth.users
ON CONFLICT(id) DO NOTHING;
