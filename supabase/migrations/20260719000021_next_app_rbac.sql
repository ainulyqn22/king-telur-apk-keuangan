-- Next.js monolith RBAC alignment.
-- The application now exposes three roles: Owner, Admin, Employee.
-- Employee access is controlled by profile permissions while legacy RLS/RPC
-- checks that reference Warehouse/Sales/Production/Finance remain compatible.

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS permissions TEXT[] NOT NULL DEFAULT '{}';

UPDATE public.profiles
SET
  permissions = CASE role
    WHEN 'Warehouse' THEN ARRAY['dashboard.read','inventory.manage','purchases.manage']::TEXT[]
    WHEN 'Sales' THEN ARRAY['dashboard.read','sales.manage','reports.read']::TEXT[]
    WHEN 'Production' THEN ARRAY['dashboard.read','production.manage']::TEXT[]
    WHEN 'Finance' THEN ARRAY['dashboard.read','expenses.manage','reports.read']::TEXT[]
    WHEN 'User' THEN ARRAY['dashboard.read']::TEXT[]
    ELSE permissions
  END,
  role = CASE
    WHEN role IN ('Owner','Admin') THEN role
    ELSE 'Employee'
  END
WHERE role IS DISTINCT FROM CASE
    WHEN role IN ('Owner','Admin') THEN role
    ELSE 'Employee'
  END;

DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  SELECT con.conname INTO constraint_name
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
  WHERE nsp.nspname = 'public'
    AND rel.relname = 'profiles'
    AND con.contype = 'c'
    AND pg_get_constraintdef(con.oid) LIKE '%role%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_role_check
CHECK (role IN ('Owner', 'Admin', 'Employee'));

CREATE OR REPLACE FUNCTION public.check_user_role(allowed_roles text[])
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_role TEXT;
  v_permissions TEXT[];
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT role, permissions INTO v_role, v_permissions
  FROM public.profiles
  WHERE id = auth.uid()
    AND deleted_at IS NULL;

  IF v_role IS NULL THEN
    RETURN FALSE;
  END IF;

  IF v_role IN ('Owner', 'Admin') THEN
    RETURN TRUE;
  END IF;

  IF v_role = 'Employee' THEN
    RETURN (
      ('Warehouse' = ANY(allowed_roles) AND v_permissions && ARRAY['inventory.manage','purchases.manage'])
      OR ('Sales' = ANY(allowed_roles) AND 'sales.manage' = ANY(v_permissions))
      OR ('Production' = ANY(allowed_roles) AND 'production.manage' = ANY(v_permissions))
      OR ('Finance' = ANY(allowed_roles) AND 'expenses.manage' = ANY(v_permissions))
    );
  END IF;

  RETURN FALSE;
END;
$$;

REVOKE ALL ON FUNCTION public.check_user_role(text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_user_role(text[]) TO authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
  INSERT INTO public.profiles(id,full_name,role,permissions,created_by,updated_by)
  VALUES(NEW.id,COALESCE(NEW.raw_user_meta_data->>'full_name',NEW.email),'Employee',ARRAY['dashboard.read']::TEXT[],NEW.id::text,NEW.id::text)
  ON CONFLICT(id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP POLICY IF EXISTS "settings_manage_admin" ON public.settings;
DROP POLICY IF EXISTS "settings_manage_owner" ON public.settings;
CREATE POLICY "settings_manage_owner_admin"
ON public.settings FOR ALL TO authenticated
USING (public.check_user_role(ARRAY['Owner', 'Admin']))
WITH CHECK (public.check_user_role(ARRAY['Owner', 'Admin']));

COMMENT ON COLUMN public.profiles.permissions IS
'Employee permission keys used by the Next.js app and mapped by check_user_role for RLS/RPC compatibility.';
