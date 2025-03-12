import { NextResponse } from "next/server";

export async function GET() {
  // Get all environment variables that start with FACEBOOK
  const facebookEnvVars = Object.keys(process.env)
    .filter(key => key.startsWith('FACEBOOK'))
    .reduce((obj, key) => {
      const value = process.env[key] || '';
      return {
        ...obj,
        [key]: {
          exists: !!value,
          length: value.length,
          firstChars: value ? value.substring(0, 10) + '...' : '',
          containsQuotes: value.includes('"'),
          containsSpaces: value.includes(' '),
          rawValue: value
        }
      };
    }, {});

  // Add direct access check
  const directAccessToken = process.env.FACEBOOK_ACCESS_TOKEN;
  const configCheck = {
    directAccessExists: !!directAccessToken,
    directAccessLength: directAccessToken?.length || 0,
    directFirstChars: directAccessToken ? directAccessToken.substring(0, 10) + '...' : '',
  };

  return NextResponse.json({
    envVars: facebookEnvVars,
    nodeEnv: process.env.NODE_ENV,
    allEnvKeys: Object.keys(process.env).filter(key => key.startsWith('FACEBOOK')),
    configCheck,
    rawAccessToken: process.env.FACEBOOK_ACCESS_TOKEN || 'not found'
  });
} 