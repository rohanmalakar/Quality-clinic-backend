export function successResponse(data: any, message?: string) {
    const response: any = {
        success: true,
        data,
    };

    if (message) {
        response.message = message;
    }

    return response;
}