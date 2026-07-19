-- Grant Owner and Admin full access across current and future ERP modules.
-- This migration is safe to apply after 20260719000021, even if that file was
-- already applied with the previous Admin-operational-only behavior.

UPDATE public.profiles
SET role = CASE lower(role)
  WHEN 'owner' THEN 'Owner'
  WHEN 'admin' THEN 'Admin'
  ELSE role
END
WHERE lower(role) IN ('owner', 'admin');

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

DROP POLICY IF EXISTS "settings_manage_admin" ON public.settings;
DROP POLICY IF EXISTS "settings_manage_owner" ON public.settings;
DROP POLICY IF EXISTS "settings_manage_owner_admin" ON public.settings;
CREATE POLICY "settings_manage_owner_admin"
ON public.settings FOR ALL TO authenticated
USING (public.check_user_role(ARRAY['Owner', 'Admin']))
WITH CHECK (public.check_user_role(ARRAY['Owner', 'Admin']));
