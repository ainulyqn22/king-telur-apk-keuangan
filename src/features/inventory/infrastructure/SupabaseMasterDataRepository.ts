import type { SupabaseClient } from "@supabase/supabase-js";
import type { Customer, CustomerType, Supplier } from "@/shared/types";
export class SupabaseMasterDataRepository {
  constructor(private readonly client: SupabaseClient) {}
  private async requireSession() {
    const current = await this.client.auth.getSession();
    if (current.error) throw new Error(current.error.message);
    if (!current.data.session) {
      const refreshed = await this.client.auth.refreshSession();
      if (refreshed.error || !refreshed.data.session)
        throw new Error(
          "Sesi login tidak aktif. Silakan keluar lalu masuk kembali.",
        );
    }
  }
  async load() {
    const [s, c, e] = await Promise.all([
      this.client
        .from("suppliers")
        .select("*")
        .is("deleted_at", null)
        .order("name"),
      this.client
        .from("customers")
        .select("*")
        .is("deleted_at", null)
        .order("name"),
      this.client
        .from("expense_categories")
        .select("name")
        .is("deleted_at", null)
        .order("name"),
    ]);
    const error = s.error ?? c.error ?? e.error;
    if (error) throw new Error(error.message);
    return {
      suppliers: (s.data ?? []) as Supplier[],
      customers: (c.data ?? []).map((row) => ({
        ...row,
        type: row.type as CustomerType,
      })) as Customer[],
      categories: (e.data ?? []).map((row) => row.name),
    };
  }
  async addSupplier(value: Omit<Supplier, "id">) {
    await this.requireSession();
    const { error } = await this.client.rpc("create_supplier", {
      p_name: value.name,
      p_address: value.address || null,
      p_phone: value.phone || null,
      p_notes: value.notes || null,
    });
    if (error) throw new Error(error.message);
  }
  async addCustomer(value: Omit<Customer, "id">) {
    await this.requireSession();
    const { error } = await this.client.rpc("create_customer", {
      p_name: value.name,
      p_type: value.type,
      p_address: value.address || null,
      p_phone: value.phone || null,
      p_notes: value.notes || null,
    });
    if (error) throw new Error(error.message);
  }
  async remove(table: "suppliers" | "customers", id: string) {
    await this.requireSession();
    const { error } = await this.client
      .from(table)
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: (await this.client.auth.getUser()).data.user?.id,
      })
      .eq("id", id);
    if (error) throw new Error(error.message);
  }
  async addCategory(name: string) {
    await this.requireSession();
    const { error } = await this.client.rpc("create_expense_category", {
      p_name: name,
    });
    if (error) throw new Error(error.message);
  }
  async removeCategory(name: string) {
    await this.requireSession();
    const { error } = await this.client
      .from("expense_categories")
      .update({ deleted_at: new Date().toISOString() })
      .eq("name", name);
    if (error) throw new Error(error.message);
  }
}
