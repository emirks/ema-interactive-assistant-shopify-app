import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
    // Debug environment variables
    const envCheck = {
        SHOPIFY_API_KEY: process.env.SHOPIFY_API_KEY ? '✅ Set' : '❌ Missing',
        SHOPIFY_API_SECRET: process.env.SHOPIFY_API_SECRET ? '✅ Set' : '❌ Missing',
        SHOPIFY_APP_URL: process.env.SHOPIFY_APP_URL ? '✅ Set' : '❌ Missing',
        SCOPES: process.env.SCOPES ? '✅ Set' : '❌ Missing',
        DATABASE_URL: process.env.DATABASE_URL ? '✅ Set' : '❌ Missing',
        NODE_ENV: process.env.NODE_ENV,
        // Show actual values (safe ones)
        values: {
            SHOPIFY_API_KEY: process.env.SHOPIFY_API_KEY,
            SHOPIFY_APP_URL: process.env.SHOPIFY_APP_URL,
            SCOPES: process.env.SCOPES,
            NODE_ENV: process.env.NODE_ENV,
        }
    };

    return json({ envCheck, timestamp: new Date().toISOString() });
};

export default function Debug() {
    const { envCheck, timestamp } = useLoaderData<typeof loader>();

    return (
        <div style={{ padding: '20px', fontFamily: 'monospace' }}>
            <h1>🔍 Debug Information</h1>
            <p>Timestamp: {timestamp}</p>

            <h2>Environment Variables Status:</h2>
            <ul>
                {Object.entries(envCheck).map(([key, value]) => {
                    if (key === 'values') return null;
                    return (
                        <li key={key}>
                            <strong>{key}:</strong> {value}
                        </li>
                    );
                })}
            </ul>

            <h2>Values:</h2>
            <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
                {JSON.stringify(envCheck.values, null, 2)}
            </pre>

            <h2>Expected Values:</h2>
            <ul>
                <li><strong>SHOPIFY_API_KEY:</strong> 564256729c36fe4740cf7a84befaa490</li>
                <li><strong>SHOPIFY_APP_URL:</strong> https://ema-interactive-assistant-shopify-a.vercel.app</li>
                <li><strong>SCOPES:</strong> write_products</li>
            </ul>
        </div>
    );
} 