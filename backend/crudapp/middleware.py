# middleware.py
class ClientIPMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Get the client's IP address from the request
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')

        # Set a default value if the IP is not available
        ip = ip or '127.0.0.1'

        # Attach the client IP to the request object for later use
        request.client_ip = ip

        response = self.get_response(request)

        return response

    def get_client_ip(self, request):
        return getattr(request, 'client_ip', None)
