// Debug script to check environment variables
console.log('🔍 Environment Variables Check:');
console.log('SHOPIFY_API_KEY:', process.env.SHOPIFY_API_KEY ? '✅ Set' : '❌ Missing');
console.log('SHOPIFY_API_SECRET:', process.env.SHOPIFY_API_SECRET ? '✅ Set' : '❌ Missing');
console.log('SHOPIFY_APP_URL:', process.env.SHOPIFY_APP_URL ? '✅ Set' : '❌ Missing');
console.log('SCOPES:', process.env.SCOPES ? '✅ Set' : '❌ Missing');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Missing');

// Show actual values (be careful not to expose secrets in production)
console.log('\n📋 Values:');
console.log('SHOPIFY_API_KEY:', process.env.SHOPIFY_API_KEY);
console.log('SHOPIFY_APP_URL:', process.env.SHOPIFY_APP_URL);
console.log('SCOPES:', process.env.SCOPES); 