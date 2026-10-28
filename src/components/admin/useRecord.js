"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdmin } from "@/components/admin/AdminShell";
import { friendlyError } from "@/components/admin/AdminUI";

// Loads one row for an editor (or starts from `blank` when id is "new"),
// and saves it back. A first save of a new row moves the URL to its id.
export function useRecord(table, id, blank, basePath) {
  const { supabase, refreshSite } = useAdmin();
  const router = useRouter();
  const isNew = id === "new";
  const [record, setRecord] = useState(isNew ? blank : null);
  const [notice, setNotice] = useState(null);
  const [saving, setSaving] = useState(false);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (isNew) return;
    let live = true;
    supabase
      .from(table)
      .select("*")
      .eq("id", id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!live) return;
        if (error) setNotice({ type: "error", text: friendlyError(error) });
        if (!data) setMissing(true);
        else setRecord(data);
      });
    return () => {
      live = false;
    };
  }, [supabase, table, id, isNew]);

  const update = (patch) => setRecord((r) => ({ ...r, ...(typeof patch === "function" ? patch(r) : patch) }));

  // `values` are the columns to write; returns the saved row or null.
  const save = async (values, { message = "Saved!", paths = [] } = {}) => {
    setSaving(true);
    setNotice(null);
    const query = isNew ? supabase.from(table).insert(values) : supabase.from(table).update(values).eq("id", id);
    const { data, error } = await query.select("*").single();
    setSaving(false);
    if (error) {
      setNotice({ type: "error", text: friendlyError(error) });
      return null;
    }
    setRecord(data);
    setNotice({ type: "ok", text: message });
    if (paths.length) refreshSite(paths);
    if (isNew) router.replace(`${basePath}/${data.id}`);
    return data;
  };

  const remove = async (paths = []) => {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) {
      setNotice({ type: "error", text: friendlyError(error) });
      return false;
    }
    if (paths.length) refreshSite(paths);
    router.replace(basePath);
    return true;
  };

  return { record, update, save, remove, notice, setNotice, saving, missing, isNew, supabase };
}

// Whether a newer column exists yet (its migration has been run), so an
// editor can hide fields the database can't save. null while checking.
export function useHasColumn(table, column) {
  const { supabase } = useAdmin();
  const [has, setHas] = useState(null);
  useEffect(() => {
    let live = true;
    supabase
      .from(table)
      .select(column)
      .limit(1)
      .then(({ error }) => live && setHas(!error));
    return () => {
      live = false;
    };
  }, [supabase, table, column]);
  return has;
}
