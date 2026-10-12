import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { parseIdParams } from "../validations/query";

type ApiErrorDetails = unknown;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 400,
    public readonly details?: ApiErrorDetails,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new ApiError("Request body must be valid JSON.", 400);
    }

    throw error;
  }
}

export function parseId(value: string): number {
  return parseIdParams({ id: value });
}

export function paginatedResponse<T>(
  data: T[],
  totalItems: number,
  page: number,
  limit: number,
): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    },
  });
}

export function successResponse<T>(
  data: T,
  statusCode = 200,
): NextResponse {
  return NextResponse.json(
    { success: true, data },
    { status: statusCode },
  );
}

export function errorResponse(
  message: string,
  statusCode: number,
  details?: ApiErrorDetails,
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        ...(details === undefined ? {} : { details }),
      },
    },
    { status: statusCode },
  );
}

function getPrismaErrorCode(error: unknown): string | null {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return error.code;
  }

  return null;
}

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return errorResponse(error.message, error.statusCode, error.details);
  }

  if (error instanceof ZodError) {
    return errorResponse(
      "Validation failed.",
      400,
      error.issues.map((issue) => ({
        path: issue.path,
        message: issue.message,
      })),
    );
  }

  const prismaErrorCode = getPrismaErrorCode(error);

  if (prismaErrorCode === "P2002") {
    return errorResponse("A record with this value already exists.", 409);
  }

  if (prismaErrorCode === "P2003") {
    return errorResponse("The record is referenced by another record.", 409);
  }

  if (prismaErrorCode === "P2025") {
    return errorResponse("The requested record was not found.", 404);
  }

  if (prismaErrorCode === "P2034") {
    return errorResponse(
      "The inventory changed during this operation. Please retry.",
      409,
    );
  }

  console.error("Unhandled API error:", error);
  return errorResponse("Internal server error.", 500);
}
