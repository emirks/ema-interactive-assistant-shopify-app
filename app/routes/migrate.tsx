import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
    let migrationStatus = "❌ Failed";
    let migrationError = null;
    let steps: string[] = [];

    try {
        steps.push("🔄 Starting migration...");

        // First, try to connect and disconnect to test basic connectivity
        await prisma.$connect();
        steps.push("✅ Database connection established");

        // Check if Session table exists
        try {
            const tableExists = await prisma.$queryRaw`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'Session'
                );
            `;

            if (!(tableExists as any)[0].exists) {
                steps.push("📋 Creating Session table...");

                // Create the Session table with proper PostgreSQL syntax
                await prisma.$executeRaw`
                    CREATE TABLE "Session" (
                        "id" TEXT PRIMARY KEY,
                        "shop" TEXT NOT NULL,
                        "state" TEXT NOT NULL,
                        "isOnline" BOOLEAN DEFAULT false NOT NULL,
                        "scope" TEXT,
                        "expires" TIMESTAMP,
                        "accessToken" TEXT NOT NULL,
                        "userId" BIGINT,
                        "firstName" TEXT,
                        "lastName" TEXT,
                        "email" TEXT,
                        "accountOwner" BOOLEAN DEFAULT false NOT NULL,
                        "locale" TEXT,
                        "collaborator" BOOLEAN DEFAULT false,
                        "emailVerified" BOOLEAN DEFAULT false
                    );
                `;
                steps.push("✅ Session table created successfully");
            } else {
                steps.push("✅ Session table already exists");
            }

            // Test session operations
            const sessionCount = await prisma.session.count();
            steps.push(`✅ Session table accessible - Found ${sessionCount} sessions`);

            migrationStatus = "✅ Success";

        } catch (tableError: any) {
            steps.push(`❌ Table operation failed: ${tableError.message}`);
            migrationError = tableError.message;
        }

    } catch (error: any) {
        steps.push(`❌ Database connection failed: ${error.message}`);
        migrationError = error.message;
    } finally {
        // Always disconnect to free up connections
        try {
            await prisma.$disconnect();
            steps.push("🔌 Database connection closed");
        } catch (disconnectError) {
            console.error("Error disconnecting from database:", disconnectError);
        }
    }

    return json({
        migrationStatus,
        migrationError,
        steps,
        timestamp: new Date().toISOString(),
        connectionPoolInfo: {
            databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Missing',
            nodeEnv: process.env.NODE_ENV,
        }
    });
};

export default function MigrationPage() {
    const data = useLoaderData<typeof loader>();

    return (
        <div style={{ padding: '20px', fontFamily: 'monospace', maxWidth: '800px' }}>
            <h1>🗄️ Database Migration</h1>
            <p><strong>Timestamp:</strong> {data.timestamp}</p>

            <h2>Migration Status: {data.migrationStatus}</h2>

            <h3>📋 Migration Steps:</h3>
            <ul>
                {data.steps.map((step, index) => (
                    <li key={index} style={{ margin: '5px 0' }}>{step}</li>
                ))}
            </ul>

            {data.migrationError && (
                <div>
                    <h3>❌ Migration Error:</h3>
                    <pre style={{ background: '#ffebee', padding: '10px', borderRadius: '5px', whiteSpace: 'pre-wrap' }}>
                        {data.migrationError}
                    </pre>
                </div>
            )}

            <h3>🔧 Connection Info:</h3>
            <ul>
                <li>Database URL: {data.connectionPoolInfo.databaseUrl}</li>
                <li>Environment: {data.connectionPoolInfo.nodeEnv}</li>
            </ul>

            <h3>💡 Next Steps:</h3>
            <ul>
                <li>If migration successful: Test your main app at <a href="/app">/app</a></li>
                <li>If failed: Check DATABASE_URL includes connection pool parameters</li>
                <li>Example: <code>postgresql://user:pass@host:port/db?connection_limit=1&pool_timeout=60</code></li>
                <li>Refresh this page to run migration again</li>
            </ul>
        </div>
    );
} 