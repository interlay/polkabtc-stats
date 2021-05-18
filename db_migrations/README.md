# Database migration scripts for Polkabtc-stats

Database migration scripts managed by [Flyway](https://flywaydb.org/)


## How it works
1. Add incremental SQL scripts to the `sql/` folder
2. Go to [Jenkins] and select the environment where the migration will be performed.
3. Run the job with `RUNTYPE=Validate` to check the current status of the database against the migrations.
4. Run the job with `RUNTYPE=Migrate` to perform the actual migration.

## Configuration
DB configuration for each environment is stored in the `env/` folder. Jenkins runs `Jenkinsfile` and automatically constructs build jobs for each environment based on these yaml files.
- `dbUrl`: JDBC connection string to the database where the migration will be performed
- `dbCredentials`: ID of the Jenkins credentials (username & password) for connecting to the database