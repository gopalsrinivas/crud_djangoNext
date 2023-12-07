"use client"
// Importing React and other necessary components
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// Assuming API_URL is defined somewhere in your environment
const API_ENDPOINT = `${process.env.API_URL}/api/personalinfo/`;

const Home = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    image: null,
  });

  const [errors, setErrors] = useState({
    name: "",
    email: "",
    mobile: "",
    image: "",
  });

  const [isInsertSuccess, setIsInsertSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  let counter = 1;

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));

    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: "",
    }));

    setIsInsertSuccess(false);
  };

  
  const validateForm = async () => {
    let isValid = true;
    const newErrors = { ...errors };

    // Name validation
    if (formData.name.trim() === "") {
      newErrors.name = "Name is required";
      isValid = false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      newErrors.email = "Invalid email address";
      isValid = false;
    }

    // Mobile validation
    const mobileRegex = /^\d{10}$/;
    if (!mobileRegex.test(formData.mobile)) {
      newErrors.mobile = "Invalid mobile number";
      isValid = false;
    }

    // Image validation
    if (!formData.image && !isEditing) {
      newErrors.image = "Image is required";
      isValid = false;
    } else if (formData.image) {
      console.log("File name:", formData.image.name); // Add this line for debugging
      const allowedExtensions = /\.(jpg|jpeg|png)$/i;
      if (!allowedExtensions.test(formData.image.name)) {
        newErrors.image =
          "Invalid image file. Please use JPG, JPEG, or PNG.";
        isValid = false;
      }
    }


    setErrors(newErrors);

    if (!isValid) {
      return false;
    }

    return isValid;
  };

  const checkExistingData = async (email, mobile) => {
    try {
      const response = await axios.get(API_ENDPOINT);
      const data = response.data;

      console.log("Response data:", data);

      const emailExists = data.results.some((user) => user.email === email);
      const mobileExists = data.results.some((user) => user.mobile === mobile);

      return {
        emailExists,
        mobileExists,
      };
    } catch (error) {
      console.error("Error checking existing data:", error);
      // Handle the error or return a default value
      return {
        emailExists: false,
        mobileExists: false,
      };
    }
  };

  const handleRealTimeValidation = async () => {
    const newErrors = { ...errors };

    // Email validation
    if (formData.email !== "") {
      const dataExists = await checkExistingData(
        formData.email,
        formData.mobile
      );
      newErrors.email = dataExists.emailExists
        ? "User with the same email already exists"
        : "";
    }

    // Mobile validation
    if (formData.mobile !== "") {
      const dataExists = await checkExistingData(
        formData.email,
        formData.mobile
      );
      newErrors.mobile = dataExists.mobileExists
        ? "User with the same mobile number already exists"
        : "";
    }

    setErrors(newErrors);
  };

  const handleReset = () => {
    setFormData({
      name: "",
      email: "",
      mobile: "",
      image: null,
    });

    setErrors({
      name: "",
      email: "",
      mobile: "",
      image: "",
    });

    setIsInsertSuccess(false);
    setIsEditing(false);
    setSelectedUser(null);

    const fileInput = document.getElementById("picture");
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsSubmitting(true);

    const isValid = await validateForm();

    if (!isValid) {
      setIsSubmitting(false);
      return;
    }

    try {
      const form = new FormData();
      form.append("name", formData.name);
      form.append("email", formData.email);
      form.append("mobile", formData.mobile);
      form.append("is_active", true);

      if (formData.image) {
        form.append("image", formData.image);
      }

      if (isEditing) {
        // Handle update logic if in edit mode
        await axios.put(`${API_ENDPOINT}${selectedUser.id}/`, form);
        toast.success("Profile updated successfully!");
      } else {
        // Handle insert logic if not in edit mode
        await axios.post(API_ENDPOINT, form);
        toast.success("Profile inserted successfully!");
      }

      handleReset();
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchData = async () => {
    try {
      const response = await axios.get(`${API_ENDPOINT}?page=${page}`);
      const userData = response.data.results;
      setUsers(userData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching user data:", error);
      setError("Error fetching user data");
      setLoading(false);
    }
  };

  useEffect(() => {
    let timeout;

    if (isInsertSuccess) {
      timeout = setTimeout(() => {
        setIsInsertSuccess(false);
      }, 3000);
    }

    handleRealTimeValidation();
    fetchData();

    return () => {
      clearTimeout(timeout);
    };
  }, [isInsertSuccess, formData.email, formData.mobile, page]);

  // delete functionality
  const handleDelete = async (userId) => {
    const shouldDelete = window.confirm("Do you want to delete this item?");

    if (!shouldDelete) {
      return;
    }

    try {
      const response = await axios.delete(`${API_ENDPOINT}${userId}/`);
      if (response.status === 204) {
        // Deletion successful, update the state
        toast.success("User deleted successfully!");
        fetchData();
      } else {
        toast.error("Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Error deleting user");
    }
  };

  const handleEdit = async (user) => {
    setFormData({
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      image: user.image, // Set the image field with the existing user's image
    });

    setIsEditing(true);
    setSelectedUser(user);

    // Real-time validation for existing email and mobile
    const newErrors = { ...errors };

    // Email validation
    if (user.email !== "") {
      const dataExists = await checkExistingData(user.email, user.mobile);
      newErrors.email = dataExists.emailExists
        ? "User with the same email already exists"
        : "";
    }

    // Mobile validation
    if (user.mobile !== "") {
      const dataExists = await checkExistingData(user.email, user.mobile);
      newErrors.mobile = dataExists.mobileExists
        ? "User with the same mobile number already exists"
        : "";
    }

    setErrors(newErrors);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    setFormData((prevData) => ({
      ...prevData,
      image: file,
    }));

    const newErrors = { ...errors };

    if (!file) {
      newErrors.image = "Image is required";
    } else {
      const allowedExtensions = /\.(jpg|jpeg|png)$/i;
      if (!allowedExtensions.test(file.name)) {
        newErrors.image = "Invalid image file. Please use JPG, JPEG, or PNG.";
      } else {
        newErrors.image = "";
      }
    }

    setErrors(newErrors);
  };


  // cancel edit functionality
  const handleCancelEdit = () => {
    setIsEditing(false);
    setSelectedUser(null);
    handleReset(); // Reset the form
  };

  const getFileNameFromUrl = (url) => {
    const pathArray = url.split('/');
    return pathArray[pathArray.length - 1];
  };

  return (
    <>
      {/* JSX content for rendering the component */}
      <h1 className="text-center scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
        Registration Details
      </h1>
      <div className="container mt-3 text-center">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">{isEditing ? "Edit profile" : "Add profile"}</Button>
          </DialogTrigger>
          {isInsertSuccess && (
            <p className="text-green-600">Profile inserted successfully!</p>
          )}
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-center">
                {isEditing ? "Edit profile" : "Add profile"}
              </DialogTitle>
            </DialogHeader>
            <hr />
            <div className="grid gap-4 py-4">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Enter Name"
                  value={formData.name}
                  onChange={handleChange}
                />
                {errors.name && (
                  <p className="text-red-500">{errors.name}</p>
                )}
              </div>

              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  placeholder="Enter email"
                  value={formData.email}
                  onChange={handleChange}
                />
                {errors.email && (
                  <p className="text-red-500">{errors.email}</p>
                )}
              </div>
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="mobile">Mobile</Label>
                <Input
                  id="mobile"
                  name="mobile"
                  placeholder="Mobile Number"
                  value={formData.mobile}
                  onChange={handleChange}
                />
                {errors.mobile && (
                  <p className="text-red-500">{errors.mobile}</p>
                )}
              </div>
         
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="picture">Picture</Label>
                <Input
                  id="picture"
                  type="file"
                  onChange={handleImageChange}
                />
                <div>
                  {formData.image && typeof formData.image === "object" && (
                    <div>
                      <img
                        src={URL.createObjectURL(formData.image)}
                        alt="Preview"
                        style={{ maxWidth: "100px", maxHeight: "100px" }}
                        />
                        {/* <p>Image Name: {formData.image.name}</p> */}
                    </div>
                  )}

                  {formData.image && typeof formData.image === "string" && (
                    <div>
                      <img
                        src={formData.image}
                        alt="Preview"
                        style={{ maxWidth: "100px", maxHeight: "100px" }}
                        />
                        {/* <p>Image Name: {getFileNameFromUrl(formData.image)}</p> */}
                    </div>
                  )}
                </div>
                {errors.image && (
                  <p className="text-red-500">{errors.image}</p>
                )}
              </div>

            </div>
            <DialogFooter>
              <Button
                type="submit"
                className={isEditing ? "bg-blue-600" : "bg-green-600"}
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (isEditing ? "Updating..." : "Submitting...") : (isEditing ? "Update" : "Save changes")}
              </Button>
              <Button variant="destructive" onClick={handleReset}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      <h1 className="text-center scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight mt-16">
        Users list
      </h1>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p>Error: {error}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>S.no</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{counter++}. </TableCell>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Button onClick={() => handleEdit(user)}>Edit</Button> /{" "}
                  <Button onClick={() => handleDelete(user.id)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <div className="flex justify-center space-x-2">
        <Button
          variant="outline"
          onClick={() => setPage((prevPage) => Math.max(prevPage - 1, 1))}
          disabled={page === 1}
        >
          Previous
        </Button>
        <span>{page}</span>
        <Button variant="outline" onClick={() => setPage((prevPage) => prevPage + 1)}>
          Next
        </Button>
      </div>
    </>
  );
};

export default Home;
