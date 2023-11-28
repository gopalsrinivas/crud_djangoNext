from rest_framework import generics
from rest_framework.response import Response
from rest_framework import status
from .models import PersonalInfo
from .serializers import PersonalInfoSerializer
from django.utils import timezone
from crudapp.pagination import CustomPagination

class PersonalInfoListCreateAPIView(generics.ListCreateAPIView):
    queryset = PersonalInfo.objects.filter(is_active=True).order_by("-id")
    serializer_class = PersonalInfoSerializer
    pagination_class = CustomPagination

    def perform_create(self, serializer):
        # Save the client IP when creating a new instance
        user_ip = getattr(self.request, 'client_ip', None)
        serializer.save(user_ip=user_ip)


class PersonalInfoRetrieveUpdateAPIView(generics.RetrieveUpdateAPIView):
    queryset = PersonalInfo.objects.all()
    serializer_class = PersonalInfoSerializer

    def update(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            existing_image = instance.image

            serializer = self.get_serializer(
                instance, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)

            # If a new image is provided
            new_image = request.data.get('image')
            if new_image:
                # If there is an old image, delete it
                if existing_image:
                    self.delete_old_image(existing_image)
                # Update the image name with the correct format
                current_datetime = timezone.now().strftime("%Y%m%d%H%M%S")
                new_filename = f"{current_datetime}.{new_image.name.split('.')[-1].lower()}"
                instance.image.name = f"public/personalinfo/{new_filename}"

                # Print the updated file name
                print(f"Updated file name: {instance.image.name}")

            self.perform_update(serializer)

            return Response(serializer.data)
        except PersonalInfo.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete_old_image(self, old_image):
        try:
            # Delete the old image file
            old_image.delete(save=False)
        except Exception as e:
            # Handle the exception (e.g., log the error)
            pass
