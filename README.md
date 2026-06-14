
  # icemgswithBackend0.2

  This is a code bundle for icemgswithBackend0.2. The original project is available at https://www.figma.com/design/Oe6Ti0kel2IfaaqqrQ8PLw/icemgswithBackend0.2.

  ## Running the code

  Run `pnpm install` to install the frontend dependencies (the repo is configured for pnpm).

  Run `pnpm run dev` to start the frontend development server.

  Backend: create and activate a Python virtualenv, then install requirements and run migrations:

  ```powershell
  & .venv\Scripts\Activate.ps1
  python -m pip install -r backend/requirements.txt
  python backend/manage.py migrate
  python backend/manage.py createsuperuser
  ```

  ## Verification Report

  See [VERIFICATION_REPORT.md](VERIFICATION_REPORT.md) for a summary of checks I ran, results, and reproduction commands.
  