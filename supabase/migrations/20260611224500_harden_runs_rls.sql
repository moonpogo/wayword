alter table if exists public.runs enable row level security;

do $$
begin
  if to_regclass('public.runs') is not null then
    execute 'drop policy if exists "runs_select_own" on public.runs';
    execute 'create policy "runs_select_own" on public.runs for select to authenticated using (auth.uid() = user_id)';

    execute 'drop policy if exists "runs_insert_own" on public.runs';
    execute 'create policy "runs_insert_own" on public.runs for insert to authenticated with check (auth.uid() = user_id)';

    execute 'drop policy if exists "runs_update_own" on public.runs';
    execute 'create policy "runs_update_own" on public.runs for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)';

    execute 'drop policy if exists "runs_delete_own" on public.runs';
    execute 'create policy "runs_delete_own" on public.runs for delete to authenticated using (auth.uid() = user_id)';
  end if;

  if to_regclass('public.observatory_summaries') is not null then
    execute 'alter table public.observatory_summaries enable row level security';

    execute 'drop policy if exists "observatory_summaries_select_own" on public.observatory_summaries';
    execute 'create policy "observatory_summaries_select_own" on public.observatory_summaries for select to authenticated using (auth.uid() = user_id)';

    execute 'drop policy if exists "observatory_summaries_insert_own" on public.observatory_summaries';
    execute 'create policy "observatory_summaries_insert_own" on public.observatory_summaries for insert to authenticated with check (auth.uid() = user_id)';

    execute 'drop policy if exists "observatory_summaries_update_own" on public.observatory_summaries';
    execute 'create policy "observatory_summaries_update_own" on public.observatory_summaries for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)';

    execute 'drop policy if exists "observatory_summaries_delete_own" on public.observatory_summaries';
    execute 'create policy "observatory_summaries_delete_own" on public.observatory_summaries for delete to authenticated using (auth.uid() = user_id)';
  end if;
end
$$;
