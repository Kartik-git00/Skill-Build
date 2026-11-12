# Skill-Build local development

Documentation-only setup audit, based on app/app.py, app/supabase_client.py, requirements.txt, .env.example and sql/*.sql. Application behavior was not run or penetration-tested.

## Prerequisites and configuration

Use a disposable local environment and a development Supabase project you control. Install a suitable Python 3 interpreter; the repository does not specify a supported version range.

From the repository root in Bash:

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
cp -i .env.example .env
```

On Windows PowerShell activate with .venv/Scripts/Activate.ps1 instead. Edit .env privately. Set SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY and a randomly generated FLASK_SECRET_KEY. The old ANON_KEY example did not match the source; code expects PUBLISHABLE_KEY. Do not use a service-role/admin secret as a browser-facing key.

app/app.py falls back to a known development session secret if FLASK_SECRET_KEY is absent. Set a strong value explicitly; this documentation change does not alter that runtime behavior. Never deploy the built-in debug server publicly.

## Database gap

The code queries domains, areas, courses, lessons, enrollments and user_progress. The repository includes SQL for the latter two only, with foreign-key dependencies on courses/lessons and auth.users. A complete schema/seed/migration sequence is not present.

Do not run these scripts against production as a setup shortcut. They replace named policies; review them and obtain a complete development schema/seed plan first. RLS is enabled for the supplied enrollment/progress tables, but policies for all referenced tables and complete access behavior still need review.

After filling valid development configuration and prerequisites, the entry point inferred from source is:

```bash
python -m flask --app app.app run --host 127.0.0.1
```

This command is documented from the module layout, not a successful run. The app requires reachable Supabase services and appropriate schema/data.

## Manual validation still required

- Verify dependency install and import with the chosen Python version.
- Confirm page rendering with complete development schema/seed data.
- Test registration/login/logout and expired/invalid token behavior.
- Confirm one user's data cannot be accessed or changed by another.
- Review session settings, redirect handling and production configuration.
- Check original analytics/forecasting claims against implemented behavior.

Record actual results in the project evidence template. Keep application changes separate from documentation PRs.
