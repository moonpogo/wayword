revoke all on public.alpha_pulse_stage_daily_totals from anon, authenticated;
grant select on public.alpha_pulse_stage_daily_totals to anon, authenticated;

revoke all on function public.wayword_alpha_pulse_stage_rows(text, jsonb, timestamp with time zone) from public, anon, authenticated;
revoke all on function private.refresh_alpha_pulse_stage_daily_totals() from public, anon, authenticated;
