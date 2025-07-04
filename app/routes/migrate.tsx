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

        // Try to create the Session table manually
        await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Session" (
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

        steps.push("✅ Session table created/verified");

        // Test the table by counting records
        const sessionCount = await prisma.session.count();
        steps.push(`✅ Table accessible, found ${sessionCount} sessions`);

        migrationStatus = "✅ Success";

    } catch (error: any) {
        migrationError = error.message;
        steps.push(`❌ Error: ${error.message}`);
        console.error("Migration error:", error);
    }

    return json({
        migrationStatus,
        migrationError,
        steps,
        timestamp: new Date().toISOString()
    });
};

export default function Migrate() {
    const { migrationStatus, migrationError, steps, timestamp } = useLoaderData<typeof loader>();

    return (
        <div style={{ padding: '20px', fontFamily: 'monospace' }}>
            <h1>🗄️ Database Migration</h1>
            <p>Timestamp: {timestamp}</p>

            <h2>Migration Status: {migrationStatus}</h2>

            <h3>Migration Steps:</h3>
            <ul>
                {steps.map((step, index) => (
                    <li key={index}>{step}</li>
                ))}
            </ul>

            {migrationError && (
                <div>
                    <h2>❌ Migration Error:</h2>
                    <pre style={{ background: '#ffe6e6', padding: '10px', borderRadius: '4px', color: 'red' }}>
                        {migrationError}
                    </pre>
                </div>
            )}

            <h2>💡 Next Steps:</h2>
            <ol>
                <li>If migration successful: Test your main app at <code>/app</code></li>
                <li>If failed: Check DATABASE_URL is properly set in Vercel</li>
                <li>Run this route again after fixing issues</li>
            </ol>

            <p><strong>Refresh this page</strong> to run migration again</p>
        </div>
    );
} 