export class AcCapitalError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status = 400) {
    super(message);
    this.name = "AcCapitalError";
    this.code = code;
    this.status = status;
  }
}

export function errorResponse(error: unknown) {
  if (error instanceof AcCapitalError) {
    return Response.json(
      { ok: false, dataMode: "disabled", source: "none", code: error.code, warning: error.message, data: null },
      { status: error.status },
    );
  }

  const message = error instanceof Error ? error.message : "Unknown AC CAPITAL OS error";
  return Response.json(
    { ok: false, dataMode: "disabled", source: "none", code: "AC_CAPITAL_ERROR", warning: message, data: null },
    { status: 500 },
  );
}
