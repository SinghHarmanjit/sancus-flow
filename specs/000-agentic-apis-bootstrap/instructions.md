1. Update the agentic-apis package so that llm gemma3 and nomic embedding models are started. see commands in start-llm.md
2. Local database is setup and has been configured in .env file
3. Wire the drizzle migration scripts generation
4. Wire the nestjs drizzle integration so that scripts run on the startup
5. Refer llm.ts and wire LLM into the agentic-apis
6. Create service layer and wire to the controller
7. Create database layer to save various agent and chat session entities
8. Test by running the nestjs server that end to end works