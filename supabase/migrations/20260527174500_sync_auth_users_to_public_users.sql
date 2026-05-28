create or replace function public.handle_auth_user_upsert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, created_at, updated_at)
  values (
    new.id,
    new.email,
    coalesce(new.created_at, timezone('utc'::text, now())),
    coalesce(new.updated_at, coalesce(new.created_at, timezone('utc'::text, now())))
  )
  on conflict (id) do update
  set
    email = excluded.email,
    updated_at = coalesce(new.updated_at, excluded.updated_at);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert or update on auth.users
for each row
execute procedure public.handle_auth_user_upsert();

insert into public.users (id, email, created_at, updated_at)
select
  au.id,
  au.email,
  coalesce(au.created_at, timezone('utc'::text, now())),
  coalesce(au.updated_at, coalesce(au.created_at, timezone('utc'::text, now())))
from auth.users au
left join public.users pu on pu.id = au.id
where pu.id is null;
