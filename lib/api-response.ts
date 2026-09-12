import { NextResponse } from 'next/server';

export interface ApiSuccessPayload<T = any> {
  success: true;
  data: T;
}

export interface ApiErrorPayload {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export function successResponse<T>(data: T, status: number = 200): NextResponse<ApiSuccessPayload<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(
  message: string,
  status: number = 400,
  code: string = 'VALIDATION_ERROR',
  details: any = null
): NextResponse<ApiErrorPayload> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details,
      },
    },
    { status }
  );
}
