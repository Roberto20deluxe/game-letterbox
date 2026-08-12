// GamesModule picks its adapter when the module file is first imported, so the
// choice has to be made before any test pulls AppModule in. The end-to-end suite
// exercises HTTP and the use cases, not the database, and pinning the driver
// keeps it from silently following a DB_DRIVER left in the shell.
process.env.DB_DRIVER = 'memory';
