import {NextResponse} from 'next/server';
export async function GET(){const ok=Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL&&process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);return NextResponse.json({app:'PANIA',version:'2.0.0',status:ok?'ok':'config_error'},{status:ok?200:503});}
