
export function successResponse(data: any) {
    return {
        success: true,
        data,
    }
}

export function errorResponse (message: string, code: number = 10000) {
    return {
        success: false,
        error: {
            code,
            message
        }
    }
}