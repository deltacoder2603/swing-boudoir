import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Lightbox } from "@/components/Lightbox";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/api/useProfile";
import { useToast } from "@/hooks/use-toast";
import { isValidSocialMediaUsername } from "@/utils/social-media";
import { Camera, Cross, Edit, Globe, Heart, MapPin, MessageSquare, Phone, Save, Upload, User, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { LinkedInLogoIcon } from "@radix-ui/react-icons";
import { CountryDropdown } from "../ui/country-dropdown";
import { cn } from "@/lib/utils";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { UnsavedChangesBar } from "../UnsavedChangesBar";

// Validation schema
const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  bio: z.string().max(500, "Bio must be less than 500 characters"),
  hobbies: z.string().max(300, "Hobbies must be less than 300 characters"),
  voterMessage: z.string().max(400, "Voter message must be less than 400 characters"),
  freeVoterMessage: z.string().max(400, "Free voter message must be less than 400 characters"),
  phone: z.string().optional(),
  address: z.string().max(200, "Address must be less than 200 characters"),
  city: z.string().max(100, "City must be less than 100 characters"),
  country: z.string().optional(),
  postalCode: z.string().max(20, "Postal code must be less than 20 characters"),
  dateOfBirth: z.string().optional(),
  gender: z.string().max(50, "Gender must be less than 50 characters"),
  instagram: z.string().max(100, "Instagram username must be less than 100 characters"),
  tiktok: z.string().max(100, "TikTok username must be less than 100 characters"),
  youtube: z.string().max(100, "YouTube channel must be less than 100 characters"),
  facebook: z.string().max(100, "Facebook username must be less than 100 characters"),
  twitter: z.string().max(100, "Twitter username must be less than 100 characters"),
  linkedin: z.string().max(200, "LinkedIn URL must be less than 200 characters"),
  website: z.string().max(200, "Website URL must be less than 200 characters"),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function EditProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const profileHooks = useProfile();
  const { updateProfile, uploadCoverImage, uploadBannerImage, uploadProfilePhotos, removeProfilePhoto } = profileHooks;

  // Fetch profile data using the hook
  const profileQuery = profileHooks.useProfileByUsername(user?.username || "");
  const { data: profileData, isLoading: profileLoading, error: profileError } = profileQuery;

  // React Hook Form setup
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      bio: "",
      hobbies: "",
      voterMessage: "",
      freeVoterMessage: "",
      phone: "",
      address: "",
      city: "",
      country: "",
      postalCode: "",
      dateOfBirth: "",
      gender: "",
      instagram: "",
      tiktok: "",
      youtube: "",
      facebook: "",
      twitter: "",
      linkedin: "",
      website: "",
    },
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = form;

  const [isEditing, setIsEditing] = useState(false);
  const [profileImages, setProfileImages] = useState<Array<{ id: string; url: string; caption: string | null }>>([]);
  const [uploadingImages, setUploadingImages] = useState<Array<{ id: string; url: string; file: File }>>([]);
  const [uploadingBanner, setUploadingBanner] = useState<{ id: string; url: string; file: File } | null>(null);
  const [uploadingCover, setUploadingCover] = useState<{ id: string; url: string; file: File } | null>(null);
  const [deletingImages, setDeletingImages] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [bannerImage, setBannerImage] = useState<{ id: string; url: string; caption: string | null } | null>(null);
  const [coverImage, setCoverImage] = useState<{ id: string; url: string; caption: string | null } | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; caption: string } | null>(null);
  const [hasPhotoChanges, setHasPhotoChanges] = useState(false);

  const profileFileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);

  // Populate form data when profile is loaded
  useEffect(() => {
    if (profileData) {
      console.log("Date of bort:", profileData.dateOfBirth);


      // Reset form with profile data
      reset({
        name: profileData.user?.name || "",
        bio: profileData.bio || "",
        hobbies: profileData.hobbiesAndPassions || "",
        voterMessage: profileData.paidVoterMessage || "",
        freeVoterMessage: profileData.freeVoterMessage || "",
        phone: profileData.phone || "",
        address: profileData.address || "",
        city: profileData.city || "",
        country: profileData.country || "",
        postalCode: profileData.postalCode || "",
        dateOfBirth: profileData.dateOfBirth ? new Date(profileData.dateOfBirth).toISOString() : "",
        gender: profileData.gender || "",
        instagram: profileData.instagram || "",
        tiktok: profileData.tiktok || "",
        youtube: profileData.youtube || "",
        facebook: profileData.facebook || "",
        twitter: profileData.twitter || "",
        linkedin: profileData.linkedin || "",
        website: profileData.website || "",
      });

      // Set images
      setProfileImages(profileData.profilePhotos || []);
      setBannerImage(profileData.bannerImage || null);
      setCoverImage(profileData.coverImage || null);
      // Don't reset hasPhotoChanges here - only reset it after successful save
    }
  }, [profileData, reset]);

  // Cleanup object URLs when component unmounts or uploading images change
  useEffect(() => {
    return () => {
      uploadingImages.forEach((img) => {
        URL.revokeObjectURL(img.url);
      });
      if (uploadingBanner) {
        URL.revokeObjectURL(uploadingBanner.url);
      }
      if (uploadingCover) {
        URL.revokeObjectURL(uploadingCover.url);
      }
    };
  }, [uploadingImages, uploadingBanner, uploadingCover]);

  const onSubmit = async (data: ProfileFormData) => {
    if (!profileData?.id) {
      toast({
        title: "Error",
        description: "Profile not found. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const updateData = {
        bio: data.bio,
        phone: data.phone,
        address: data.address,
        city: data.city,
        country: data.country,
        postalCode: data.postalCode,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        hobbiesAndPassions: data.hobbies,
        paidVoterMessage: data.voterMessage,
        freeVoterMessage: data.freeVoterMessage,
        instagram: data.instagram,
        tiktok: data.tiktok,
        youtube: data.youtube,
        facebook: data.facebook,
        twitter: data.twitter,
        linkedin: data.linkedin,
        website: data.website,
      };

      await updateProfile.mutateAsync({
        id: profileData.id,
        data: {
          ...updateData,
          user: {
            name: data.name,
          },
        },
      });

      setIsEditing(false);
      setHasPhotoChanges(false); // Reset photo changes after successful save
      form.reset(data); // Reset form to mark it as not dirty
      toast({
        title: "Profile Updated!",
        description: "Your profile has been saved successfully.",
        variant: "default",
      });
    } catch (error) {
      console.error("Update profile error:", error);
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleProfilePhotosUpload = async (files: FileList | null) => {
    if (!files || !profileData?.id) return;

    const maxImages = 20;
    const currentImages = profileImages.length;

    if (currentImages + files.length > maxImages) {
      toast({
        title: "Too Many Images",
        description: `You can only upload up to ${maxImages} profile images.`,
        variant: "destructive",
      });
      return;
    }

    // Add images to uploading state with preview URLs
    const newUploadingImages = Array.from(files).map((file, index) => ({
      id: `uploading-${Date.now()}-${index}`,
      url: URL.createObjectURL(file),
      file,
    }));

    setUploadingImages((prev) => [...prev, ...newUploadingImages]);
    setHasPhotoChanges(true); // Mark that photos have changed

    try {
      await uploadProfilePhotos.mutateAsync({
        id: profileData.id,
        files: Array.from(files),
      });

      // Refresh profile data to get the new profile photos
      await profileQuery.refetch();

      // Remove uploaded images from uploading state
      setUploadingImages((prev) => prev.filter((img) => !newUploadingImages.some((newImg) => newImg.id === img.id)));

      toast({
        title: "Images Uploaded!",
        description: `${files.length} image(s) have been uploaded successfully.`,
        variant: "default",
      });
    } catch (error) {
      // Remove failed images from uploading state
      setUploadingImages((prev) => prev.filter((img) => !newUploadingImages.some((newImg) => newImg.id === img.id)));
      setHasPhotoChanges(false); // Reset photo changes on error

      toast({
        title: "Upload Failed",
        description: "Failed to upload images. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCoverImageUpload = async (files: FileList | null) => {
    if (!files || !profileData?.id) return;

    const file = files[0];

    // Add cover image to uploading state with preview URL
    const newUploadingCover = {
      id: `uploading-cover-${Date.now()}`,
      url: URL.createObjectURL(file),
      file,
    };

    setUploadingCover(newUploadingCover);
    setHasPhotoChanges(true); // Mark that photos have changed

    try {
      await uploadCoverImage.mutateAsync({
        id: profileData.id,
        file,
      });

      // Refresh profile data to get the new cover image
      await profileQuery.refetch();

      // Remove uploaded cover image from uploading state
      setUploadingCover(null);

      toast({
        title: "Cover Image Uploaded!",
        description: "Your profile picture has been uploaded successfully.",
        variant: "default",
      });
    } catch (error) {
      // Remove failed cover image from uploading state
      setUploadingCover(null);
      setHasPhotoChanges(false); // Reset photo changes on error

      toast({
        title: "Upload Failed",
        description: "Failed to upload cover image. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBannerImageUpload = async (files: FileList | null) => {
    if (!files || !profileData?.id) return;

    const file = files[0];

    // Add banner to uploading state with preview URL
    const newUploadingBanner = {
      id: `uploading-banner-${Date.now()}`,
      url: URL.createObjectURL(file),
      file,
    };

    setUploadingBanner(newUploadingBanner);
    setHasPhotoChanges(true); // Mark that photos have changed

    try {
      await uploadBannerImage.mutateAsync({
        id: profileData.id,
        file,
      });

      // Refresh profile data to get the new banner
      await profileQuery.refetch();

      // Remove uploaded banner from uploading state
      setUploadingBanner(null);

      toast({
        title: "Banner Image Uploaded!",
        description: "Your banner image has been uploaded successfully.",
        variant: "default",
      });
    } catch (error) {
      // Remove failed banner from uploading state
      setUploadingBanner(null);
      setHasPhotoChanges(false); // Reset photo changes on error

      toast({
        title: "Upload Failed",
        description: "Failed to upload banner image. Please try again.",
        variant: "destructive",
      });
    }
  };

  const removeImage = async (imageId: string) => {
    if (!profileData?.id) return;

    setDeletingImages((prev) => new Set([...prev, imageId]));
    setHasPhotoChanges(true); // Mark that photos have changed

    // Show loading toast
    const loadingToast = toast({
      title: "Deleting Image",
      description: "Please wait while we remove your image...",
    });

    try {
      await removeProfilePhoto.mutateAsync({
        id: profileData.id,
        imageId,
      });

      // Optimistically update local state
      setProfileImages((prev) => prev.filter((img) => img.id !== imageId));

      // Dismiss loading toast and show success
      loadingToast.dismiss();
      toast({
        title: "Image Removed",
        description: "Profile image has been removed successfully.",
      });
    } catch (error) {
      // Dismiss loading toast and show error
      loadingToast.dismiss();
      setHasPhotoChanges(false); // Reset photo changes on error
      toast({
        title: "Error",
        description: "Failed to remove image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingImages((prev) => {
        const newSet = new Set(prev);
        newSet.delete(imageId);
        return newSet;
      });
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <div className="max-w-6xl mx-auto space-y-6 sm:p-4">
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto"></div>
            <p className="mt-4 text-lg text-muted-foreground">Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <div className="max-w-6xl mx-auto space-y-6 sm:p-4">
          <div className="text-center py-16">
            <div className="text-red-500 mb-4">
              <X className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Error Loading Profile</h3>
            <p className="text-muted-foreground mb-4">Failed to load your profile data.</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-6xl mx-auto space-y-6 sm:p-4">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Edit Profile</h1>
              <p className="text-muted-foreground text-sm">Manage your profile information and preferences</p>
            </div>
            <Button
              onClick={() => setIsEditing((prev) => !prev)}
              className="flex items-center gap-2 px-6 py-2 text-sm font-medium transition-all duration-200 hover:scale-105"
              disabled={isSaving || isUploading || updateProfile.isPending}
              size="lg"
            >
              {isEditing ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
              {isEditing ? "Cancel" : "Edit Profile"}
            </Button>
          </div>
          {isEditing && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/50 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
                <Edit className="h-4 w-4" />
                You are currently in edit mode. {(isDirty || hasPhotoChanges) && "You have unsaved changes!"}
                {!isDirty && !hasPhotoChanges && "Don't forget to save your changes!"}
              </p>
            </div>
          )}

          {/* Debug Information - Remove this in production */}
          {/* <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-950/50 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-700 dark:text-yellow-300 font-medium mb-2">Debug Info:</p>
            <div className="text-xs text-yellow-600 dark:text-yellow-400 space-y-1">
              <p>Profile Images Count: {profileImages.length}</p>
              <p>Banner Image: {bannerImage ? `ID: ${bannerImage.id}, URL: ${bannerImage.url || "No URL"}` : "None"}</p>
              <p>Cover Image: {coverImage ? `ID: ${coverImage.id}, URL: ${coverImage.url || "No URL"}` : "None"}</p>
              <p>Profile Data Loaded: {profileData ? "Yes" : "No"}</p>
              <p>Profile Loading: {profileLoading ? "Yes" : "No"}</p>
              <p>Profile Error: {profileError ? "Yes" : "No"}</p>
            </div>
          </div> */}
        </div>

        <div className="space-y-6 sm:space-y-8">
          {/* Banner and Cover Image Section */}
          <div className="mb-6 sm:mb-8">
            <label className="flex items-center justify-start gap-2 mb-4">
              <Camera className="w-4 h-4" /> Banner & Profile Picture
            </label>

            {/* Banner Upload Area */}
            <div className="relative mb-16 sm:mb-20">
              <input
                type="file"
                ref={bannerFileInputRef}
                accept="image/*"
                onChange={(e) => handleBannerImageUpload(e.target.files)}
                className="hidden"
                disabled={uploadBannerImage.isPending || !isEditing}
                aria-label="Upload banner image"
              />

              <div
                onClick={() => !uploadBannerImage.isPending && isEditing && bannerFileInputRef.current?.click()}
                className={cn(
                  "relative w-full aspect-[4/1] sm:aspect-[4/1] bg-gray-200 border border-dashed border-gray-400 rounded-lg flex items-center justify-center transition-all duration-200 overflow-hidden",
                  uploadBannerImage.isPending || !isEditing ? "cursor-not-allowed" : "cursor-pointer hover:border-yellow-400 hover:bg-yellow-400/10"
                )}
              >
                {(bannerImage && bannerImage.url) || uploadingBanner ? (
                  <>
                    <img
                      src={uploadingBanner ? uploadingBanner.url : bannerImage!.url}
                      alt="Profile Banner"
                      className={`w-full h-full object-cover pointer-events-none ${uploadingBanner ? "blur-sm opacity-75" : ""}`}
                    />
                    <div className="absolute top-2 right-2 flex gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLightboxImage({
                            url: uploadingBanner ? uploadingBanner.url : bannerImage!.url,
                            caption: "Profile Banner",
                          });
                        }}
                        className="w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-xs sm:text-sm hover:bg-green-600 transition-colors z-10"
                        title="View banner image"
                        disabled={uploadBannerImage.isPending}
                      >
                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isEditing) {
                            bannerFileInputRef.current?.click();
                          }
                        }}
                        className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white text-xs sm:text-sm transition-colors z-10 ${
                          isEditing ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-400 cursor-not-allowed"
                        }`}
                        title={isEditing ? "Change banner image" : "Enable edit mode to change banner"}
                        disabled={uploadBannerImage.isPending || !isEditing}
                      >
                        <Upload className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center px-4">
                    <Camera className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-4 text-gray-400" />
                    {isEditing ? (
                      <>
                        <p className="text-sm sm:text-lg mb-1 sm:mb-2">Drop your banner image here or click to browse</p>
                        <p className="text-xs sm:text-sm text-gray-400">JPG, PNG, WEBP up to 10MB</p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm sm:text-lg mb-1 sm:mb-2">Click "Edit Profile" to upload banner</p>
                        <p className="text-xs sm:text-sm text-gray-400">Enable edit mode to change your banner image</p>
                      </>
                    )}
                  </div>
                )}

                {/* Loading overlay for banner upload */}
                {uploadBannerImage.isPending && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-20">
                    <div className="text-center text-white px-4">
                      <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-4 border-white border-t-transparent mx-auto mb-2 sm:mb-4"></div>
                      <p className="text-sm sm:text-lg font-medium">Uploading Banner...</p>
                      <p className="text-xs sm:text-sm text-white/80">Please wait while we process your image</p>
                    </div>
                  </div>
                )}

                {/* Optimistic banner preview with blur effect */}
                {uploadingBanner && !uploadBannerImage.isPending && (
                  <div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-15">
                    <div className="text-center text-white">
                      <div className="animate-spin rounded-full h-6 w-6 sm:h-10 sm:w-10 border-3 border-white border-t-transparent mx-auto mb-2 sm:mb-3"></div>
                      <p className="text-xs sm:text-sm font-medium">Processing Banner...</p>
                      <p className="text-xs text-white/80">Your new banner is being prepared</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Cover Image (Avatar) Overlapping on Left */}
              <div className="absolute -bottom-12 sm:-bottom-16 left-4 sm:left-8">
                <input
                  type="file"
                  ref={coverFileInputRef}
                  accept="image/*"
                  onChange={(e) => handleCoverImageUpload(e.target.files)}
                  className="hidden"
                  disabled={uploadCoverImage.isPending || !isEditing}
                  aria-label="Upload profile picture"
                />

                <div
                  onClick={() => !uploadCoverImage.isPending && isEditing && coverFileInputRef.current?.click()}
                  className={`relative w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white shadow-xl transition-all duration-200 bg-white ${
                    uploadCoverImage.isPending || !isEditing ? "cursor-not-allowed" : "cursor-pointer hover:scale-105"
                  }`}
                >
                  {(coverImage && coverImage.url) || uploadingCover ? (
                    <>
                      <img
                        src={uploadingCover ? uploadingCover.url : coverImage!.url}
                        alt="Profile Picture"
                        className={`w-full h-full object-cover rounded-full ${uploadingCover ? "blur-sm opacity-75" : ""}`}
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity duration-200 rounded-full flex items-center justify-center">
                        <div className="flex flex-col gap-1 sm:gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setLightboxImage({
                                url: uploadingCover ? uploadingCover.url : coverImage!.url,
                                caption: "Profile Picture",
                              });
                            }}
                            className="bg-green-500 hover:bg-green-600 text-white rounded-full p-1 sm:p-1.5 transition-colors duration-200 shadow-lg"
                            title="View profile picture"
                            disabled={uploadCoverImage.isPending}
                          >
                            <svg className="w-2 h-2 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isEditing) {
                                coverFileInputRef.current?.click();
                              }
                            }}
                            className={`rounded-full p-1 sm:p-1.5 transition-colors duration-200 shadow-lg ${
                              isEditing ? "bg-blue-500 hover:bg-blue-600 text-white" : "bg-gray-400 text-gray-200 cursor-not-allowed"
                            }`}
                            title={isEditing ? "Change profile picture" : "Enable edit mode to change profile picture"}
                            disabled={uploadCoverImage.isPending || !isEditing}
                          >
                            <Upload className="w-2 h-2 sm:w-3 sm:h-3" />
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center rounded-full bg-gray-100">
                      <User className="w-6 h-6 sm:w-10 sm:h-10 text-gray-500" />
                      <span className="text-xs text-gray-500 mt-1">{isEditing ? "Upload Avatar" : "Click Edit to Upload"}</span>
                    </div>
                  )}

                  {/* Loading overlay for cover image upload */}
                  {uploadCoverImage.isPending && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center rounded-full z-20">
                      <div className="text-center text-white">
                        <div className="animate-spin rounded-full h-4 w-4 sm:h-6 sm:w-6 border-2 border-white border-t-transparent mx-auto mb-1 sm:mb-2"></div>
                        <p className="text-xs font-medium">Uploading...</p>
                      </div>
                    </div>
                  )}

                  {/* Optimistic cover preview with blur effect */}
                  {uploadingCover && !uploadCoverImage.isPending && (
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center rounded-full z-15">
                      <div className="text-center text-white">
                        <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-white border-t-transparent mx-auto mb-1 sm:mb-2"></div>
                        <p className="text-xs font-medium">Processing...</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Profile Photos Gallery Section */}
          <div className="mb-6 sm:mb-8">
            <label className="flex items-center justify-start gap-2 mb-4">
              <Upload className="w-4 h-4" /> Profile Photos Gallery (Up to 20)
            </label>

            <input
              type="file"
              ref={profileFileInputRef}
              multiple
              accept="image/*"
              onChange={(e) => handleProfilePhotosUpload(e.target.files)}
              className="hidden"
              disabled={uploadProfilePhotos.isPending || !isEditing}
              aria-label="Upload profile photos"
            />

            <div
              onClick={() => !uploadProfilePhotos.isPending && isEditing && profileFileInputRef.current?.click()}
              className={`border-2 border-dashed border-gray-400 rounded-lg p-4 sm:p-8 text-center transition-all duration-200 relative overflow-hidden ${
                uploadProfilePhotos.isPending || !isEditing ? "cursor-not-allowed border-gray-300 bg-gray-50" : "cursor-pointer hover:border-yellow-400 hover:bg-yellow-400/10"
              }`}
            >
              <Upload className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-4 text-gray-400" />
              {isEditing ? (
                <>
                  <p className="text-sm sm:text-lg mb-1 sm:mb-2">Drop your portfolio photos here or click to browse</p>
                  <p className="text-xs sm:text-sm text-gray-400">JPG, PNG, WEBP up to 10MB each</p>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2">{profileImages.length + uploadingImages.length}/20 photos uploaded</p>
                </>
              ) : (
                <>
                  <p className="text-sm sm:text-lg mb-1 sm:mb-2">Click "Edit Profile" to upload photos</p>
                  <p className="text-xs sm:text-sm text-gray-400">Enable edit mode to manage your portfolio</p>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2">{profileImages.length + uploadingImages.length}/20 photos uploaded</p>
                </>
              )}

              {/* Loading overlay for profile photos upload */}
              {uploadProfilePhotos.isPending && (
                <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-10">
                  <div className="text-center px-4">
                    <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-3 border-primary border-t-transparent mx-auto mb-2 sm:mb-3"></div>
                    <p className="text-xs sm:text-sm font-medium text-gray-700">Uploading Images...</p>
                    <p className="text-xs text-gray-500">Please wait while we process your photos</p>
                  </div>
                </div>
              )}
            </div>

            {profileImages.length > 0 || uploadingImages.length > 0 ? (
              <div className="mt-4 sm:mt-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {/* Show uploaded images */}
                  {profileImages.map((image, index) => (
                    <div key={image.id} className="relative group aspect-square">
                      {image.url ? (
                        <img
                          src={image.url}
                          alt={`Profile ${index + 1}`}
                          className={`w-full h-full object-cover rounded-lg shadow-sm transition-transform duration-300 group-hover:scale-105 ${
                            deletingImages.has(image.id) ? "opacity-50 blur-sm" : ""
                          }`}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            target.nextElementSibling?.classList.remove("hidden");
                          }}
                        />
                      ) : null}
                      {!image.url && (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
                          <div className="text-center">
                            <Upload className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2 text-gray-400" />
                            <p className="text-xs text-gray-500">Image not available</p>
                          </div>
                        </div>
                      )}

                      {/* Loading overlay when deleting */}
                      {deletingImages.has(image.id) && (
                        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center rounded-lg z-20">
                          <div className="text-center text-white">
                            <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-2 border-white border-t-transparent mx-auto mb-1 sm:mb-2"></div>
                            <p className="text-xs font-medium">Deleting...</p>
                          </div>
                        </div>
                      )}

                      {/* Remove button - top right */}
                      {isEditing && (
                        <button
                          onClick={() => removeImage(image.id)}
                          className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 sm:p-1.5 transition-colors duration-200 shadow-lg opacity-0 group-hover:opacity-100 z-10"
                          title={`Remove profile image ${index + 1}`}
                          disabled={uploadProfilePhotos.isPending || deletingImages.has(image.id)}
                        >
                          {deletingImages.has(image.id) ? (
                            <div className="animate-spin rounded-full h-2 w-2 sm:h-3 sm:w-3 border-2 border-white border-t-transparent" />
                          ) : (
                            <X className="h-2 w-2 sm:h-3 sm:w-3" />
                          )}
                        </button>
                      )}

                      {/* View button - center */}
                      {image.url && !deletingImages.has(image.id) && (
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center">
                          <button
                            onClick={() => {
                              setLightboxImage({
                                url: image.url,
                                caption: image.caption || "",
                              });
                            }}
                            className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-1.5 sm:p-2 transition-colors duration-200 shadow-lg"
                            title={`View profile image ${index + 1}`}
                            disabled={uploadProfilePhotos.isPending}
                          >
                            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Show uploading images with blur and loader */}
                  {uploadingImages.map((image, index) => (
                    <div key={image.id} className="relative group aspect-square">
                      <img src={image.url} alt={`Uploading ${index + 1}`} className="w-full h-full object-cover rounded-lg shadow-sm blur-sm opacity-75" />

                      {/* Loading overlay for uploading images */}
                      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center rounded-lg">
                        <div className="text-center text-white">
                          <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-2 border-white border-t-transparent mx-auto mb-1 sm:mb-2"></div>
                          <p className="text-xs font-medium">Uploading...</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-4 sm:mt-6 p-4 sm:p-8 text-center bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
                <Upload className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-4 text-gray-400" />
                <p className="text-sm sm:text-lg text-gray-600 dark:text-gray-400 mb-1 sm:mb-2">No profile photos yet</p>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500">Upload your first profile photo to get started</p>
              </div>
            )}
          </div>

          {/* Basic Information & Location */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Basic Information */}
            <Card className="lg:col-span-2 shadow-lg border-0 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium flex items-center gap-2 mb-2">
                      <User className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                      Profile Name
                    </Label>
                    <Controller
                      name="name"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          id="name"
                          disabled={!isEditing}
                          className={cn(
                            !isEditing ? "bg-muted/50 cursor-not-allowed" : "transition-all duration-200 focus:ring-2 focus:ring-primary/20",
                            errors.name && "border-red-500 focus:ring-red-500/20"
                          )}
                        />
                      )}
                    />
                    {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-2 mb-2">
                      <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                      Phone Number
                    </Label>
                    <Controller
                      name="phone"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          id="phone"
                          disabled={!isEditing}
                          placeholder="+1 210 456 2719"
                          className={cn(
                            !isEditing ? "bg-muted/50 cursor-not-allowed" : "transition-all duration-200 focus:ring-2 focus:ring-primary/20",
                            errors.phone && "border-red-500 focus:ring-red-500/20"
                          )}
                        />
                      )}
                    />
                    {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
                  </div>
                </div>

                <div>
                  <Label htmlFor="bio" className="text-sm font-medium flex items-center gap-2 mb-2">
                    <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                    Bio / Short Introduction
                  </Label>
                  <Controller
                    name="bio"
                    control={control}
                    render={({ field }) => (
                      <Textarea
                        {...field}
                        id="bio"
                        disabled={!isEditing}
                        rows={3}
                        placeholder="Tell people about yourself..."
                        className={cn(
                          !isEditing ? "bg-muted/50 cursor-not-allowed" : "transition-all duration-200 focus:ring-2 focus:ring-primary/20 resize-none",
                          errors.bio && "border-red-500 focus:ring-red-500/20"
                        )}
                      />
                    )}
                  />
                  {errors.bio && <p className="text-xs text-red-500 mt-1">{errors.bio.message}</p>}
                </div>

                <div>
                  <Label htmlFor="hobbies" className="text-sm font-medium flex items-center gap-2 mb-2">
                    <Heart className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                    Hobbies & Interests
                  </Label>
                  <Controller
                    name="hobbies"
                    control={control}
                    render={({ field }) => (
                      <Textarea
                        {...field}
                        id="hobbies"
                        disabled={!isEditing}
                        rows={2}
                        placeholder="What do you enjoy doing?"
                        className={cn(
                          !isEditing ? "bg-muted/50 cursor-not-allowed" : "transition-all duration-200 focus:ring-2 focus:ring-primary/20 resize-none",
                          errors.hobbies && "border-red-500 focus:ring-red-500/20"
                        )}
                      />
                    )}
                  />
                  {errors.hobbies && <p className="text-xs text-red-500 mt-1">{errors.hobbies.message}</p>}
                </div>
              </CardContent>
            </Card>

            {/* Location Information */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="h-5 w-5 text-primary" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="city" className="text-sm font-medium mb-2 block">
                    City
                  </Label>
                  <Controller
                    name="city"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="city"
                        disabled={!isEditing}
                        placeholder="Manhattan"
                        className={cn(
                          !isEditing ? "bg-muted/50 cursor-not-allowed" : "transition-all duration-200 focus:ring-2 focus:ring-primary/20",
                          errors.city && "border-red-500 focus:ring-red-500/20"
                        )}
                      />
                    )}
                  />
                  {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city.message}</p>}
                </div>

                <div>
                  <Label htmlFor="country" className="text-sm font-medium mb-2 block">
                    Country
                  </Label>
                  <Controller
                    name="country"
                    control={control}
                    render={({ field }) => (
                      <CountryDropdown
                        defaultValue={field.value}
                        onChange={(country) => field.onChange(country.alpha3)}
                        disabled={!isEditing}
                        placeholder="Select country"
                        classNames={{
                          popupTrigger: cn(
                            "w-full font-normal !mt-0 bg-white",
                            !isEditing ? "bg-muted/50 cursor-not-allowed" : "transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                          ),
                        }}
                      />
                    )}
                  />
                  {errors.country && <p className="text-xs text-red-500 mt-1">{errors.country.message}</p>}
                </div>

                <div>
                  <Label htmlFor="address" className="text-sm font-medium mb-2 block">
                    Address
                  </Label>
                  <Controller
                    name="address"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="address"
                        disabled={!isEditing}
                        placeholder="Street address"
                        className={cn(
                          !isEditing ? "bg-muted/50 cursor-not-allowed" : "transition-all duration-200 focus:ring-2 focus:ring-primary/20",
                          errors.address && "border-red-500 focus:ring-red-500/20"
                        )}
                      />
                    )}
                  />
                  {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address.message}</p>}
                </div>

                <div>
                  <Label htmlFor="postalCode" className="text-sm font-medium mb-2 block">
                    Postal Code
                  </Label>
                  <Controller
                    name="postalCode"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="postalCode"
                        disabled={!isEditing}
                        placeholder="10001"
                        className={cn(
                          !isEditing ? "bg-muted/50 cursor-not-allowed" : "transition-all duration-200 focus:ring-2 focus:ring-primary/20",
                          errors.postalCode && "border-red-500 focus:ring-red-500/20"
                        )}
                      />
                    )}
                  />
                  {errors.postalCode && <p className="text-xs text-red-500 mt-1">{errors.postalCode.message}</p>}
                </div>

                <div>
                  <Label htmlFor="dateOfBirth" className="text-sm font-medium mb-2 block">
                    Date of Birth
                  </Label>

                  <Controller
                    name="dateOfBirth"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="dateOfBirth"
                        type="date"
                        disabled={!isEditing}
                        value={field.value ? new Date(field.value).toISOString().split("T")[0] : ""}
                        onChange={(e) => field.onChange(e.target.value)}
                        className={cn(
                          !isEditing ? "bg-muted/50 cursor-not-allowed" : "transition-all duration-200 focus:ring-2 focus:ring-primary/20",
                          errors.dateOfBirth && "border-red-500 focus:ring-red-500/20"
                        )}
                      />
                    )}
                  />
                  {errors.dateOfBirth && <p className="text-xs text-red-500 mt-1">{errors.dateOfBirth.message}</p>}
                </div>

                <div>
                  <Label htmlFor="gender" className="text-sm font-medium mb-2 block">
                    Gender
                  </Label>
                  <Controller
                    name="gender"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="gender"
                        disabled={!isEditing}
                        placeholder="Gender"
                        className={cn(
                          !isEditing ? "bg-muted/50 cursor-not-allowed" : "transition-all duration-200 focus:ring-2 focus:ring-primary/20",
                          errors.gender && "border-red-500 focus:ring-red-500/20"
                        )}
                      />
                    )}
                  />
                  {errors.gender && <p className="text-xs text-red-500 mt-1">{errors.gender.message}</p>}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Social Media Links */}
          <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Globe className="h-5 w-5 text-primary" />
                Social Media & Online Presence
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Connect your social media profiles and website</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="instagram" className="text-sm font-medium flex items-center gap-2">
                    <Icons.instagram className="h-4 w-4 fill-pink-500" />
                    Instagram
                  </Label>
                  <Controller
                    name="instagram"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="instagram"
                        disabled={!isEditing}
                        placeholder="yourusername (without @)"
                        className={cn(
                          !isEditing ? "bg-muted/50 cursor-not-allowed" : "transition-all duration-200 focus:ring-2 focus:ring-primary/20",
                          errors.instagram && "border-red-500 focus:ring-red-500/20",
                          field.value && !isValidSocialMediaUsername("instagram", field.value) && "border-red-500 focus:ring-red-500/20"
                        )}
                      />
                    )}
                  />
                  {errors.instagram && <p className="text-xs text-red-500 mt-1">{errors.instagram.message}</p>}
                  {form.watch("instagram") && !isValidSocialMediaUsername("instagram", form.watch("instagram")) && (
                    <p className="text-xs text-red-500 mt-1">Invalid Instagram username format</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tiktok" className="text-sm font-medium flex items-center gap-2">
                    <Icons.tiktok className="h-4 w-4 fill-black dark:fill-white" />
                    TikTok
                  </Label>
                  <Controller
                    name="tiktok"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="tiktok"
                        disabled={!isEditing}
                        placeholder="yourusername (without @)"
                        className={cn(
                          !isEditing ? "bg-muted/50 cursor-not-allowed" : "transition-all duration-200 focus:ring-2 focus:ring-primary/20",
                          errors.tiktok && "border-red-500 focus:ring-red-500/20",
                          field.value && !isValidSocialMediaUsername("tiktok", field.value) && "border-red-500 focus:ring-red-500/20"
                        )}
                      />
                    )}
                  />
                  {errors.tiktok && <p className="text-xs text-red-500 mt-1">{errors.tiktok.message}</p>}
                  {form.watch("tiktok") && !isValidSocialMediaUsername("tiktok", form.watch("tiktok")) && (
                    <p className="text-xs text-red-500 mt-1">Invalid TikTok username format</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="youtube" className="text-sm font-medium flex items-center gap-2">
                    <Icons.youtube className="h-4 w-4 fill-red-500 text-red-500" />
                    YouTube
                  </Label>
                  <Controller
                    name="youtube"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="youtube"
                        disabled={!isEditing}
                        placeholder="yourchannel (without @)"
                        className={cn(
                          !isEditing ? "bg-muted/50 cursor-not-allowed" : "transition-all duration-200 focus:ring-2 focus:ring-primary/20",
                          errors.youtube && "border-red-500 focus:ring-red-500/20",
                          field.value && !isValidSocialMediaUsername("youtube", field.value) && "border-red-500 focus:ring-red-500/20"
                        )}
                      />
                    )}
                  />
                  {errors.youtube && <p className="text-xs text-red-500 mt-1">{errors.youtube.message}</p>}
                  {form.watch("youtube") && !isValidSocialMediaUsername("youtube", form.watch("youtube")) && (
                    <p className="text-xs text-red-500 mt-1">Invalid YouTube channel format</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="twitter" className="text-sm font-medium flex items-center gap-2">
                    <Icons.x className="h-4 w-4 fill-black dark:fill-white" />
                    Twitter
                  </Label>
                  <Controller
                    name="twitter"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="twitter"
                        disabled={!isEditing}
                        placeholder="yourusername (without @)"
                        className={cn(
                          !isEditing ? "bg-muted/50 cursor-not-allowed" : "transition-all duration-200 focus:ring-2 focus:ring-primary/20",
                          errors.twitter && "border-red-500 focus:ring-red-500/20",
                          field.value && !isValidSocialMediaUsername("twitter", field.value) && "border-red-500 focus:ring-red-500/20"
                        )}
                      />
                    )}
                  />
                  {errors.twitter && <p className="text-xs text-red-500 mt-1">{errors.twitter.message}</p>}
                  {form.watch("twitter") && !isValidSocialMediaUsername("twitter", form.watch("twitter")) && (
                    <p className="text-xs text-red-500 mt-1">Invalid Twitter username format</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="facebook" className="text-sm font-medium flex items-center gap-2">
                    <Icons.facebook className="h-4 w-4 fill-blue-600" />
                    Facebook
                  </Label>
                  <Controller
                    name="facebook"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="facebook"
                        disabled={!isEditing}
                        placeholder="yourusername"
                        className={cn(
                          !isEditing ? "bg-muted/50 cursor-not-allowed" : "transition-all duration-200 focus:ring-2 focus:ring-primary/20",
                          errors.facebook && "border-red-500 focus:ring-red-500/20",
                          field.value && !isValidSocialMediaUsername("facebook", field.value) && "border-red-500 focus:ring-red-500/20"
                        )}
                      />
                    )}
                  />
                  {errors.facebook && <p className="text-xs text-red-500 mt-1">{errors.facebook.message}</p>}
                  {form.watch("facebook") && !isValidSocialMediaUsername("facebook", form.watch("facebook")) && (
                    <p className="text-xs text-red-500 mt-1">Invalid Facebook username format</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="linkedin" className="text-sm font-medium flex items-center gap-2">
                    <LinkedInLogoIcon className="h-4 w-4 text-blue-700" />
                    LinkedIn
                  </Label>
                  <Controller
                    name="linkedin"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="linkedin"
                        disabled={!isEditing}
                        placeholder="https://linkedin.com/in/yourusername"
                        className={cn(
                          !isEditing ? "bg-muted/50 cursor-not-allowed" : "transition-all duration-200 focus:ring-2 focus:ring-primary/20",
                          errors.linkedin && "border-red-500 focus:ring-red-500/20"
                        )}
                      />
                    )}
                  />
                  {errors.linkedin && <p className="text-xs text-red-500 mt-1">{errors.linkedin.message}</p>}
                </div>

                <div className="space-y-2 md:col-span-2 lg:col-span-3">
                  <Label htmlFor="website" className="text-sm font-medium flex items-center gap-2">
                    <Globe className="h-4 w-4 text-green-600" />
                    Website
                  </Label>
                  <Controller
                    name="website"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="website"
                        disabled={!isEditing}
                        placeholder="https://yourwebsite.com"
                        className={cn(
                          !isEditing ? "bg-muted/50 cursor-not-allowed" : "transition-all duration-200 focus:ring-2 focus:ring-primary/20",
                          errors.website && "border-red-500 focus:ring-red-500/20"
                        )}
                      />
                    )}
                  />
                  {errors.website && <p className="text-xs text-red-500 mt-1">{errors.website.message}</p>}
                </div>
              </div>
            </CardContent>
          </Card>


          {/* Save Button at Bottom */}
          {/* {isEditing && (
            <Card className="shadow-lg border-0 bg-gradient-to-r from-primary/5 to-primary/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">Ready to save your changes?</h3>
                    <p className="text-sm text-muted-foreground">Make sure all your information is correct before saving.</p>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving} className="transition-all duration-200 hover:scale-105">
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSubmit(onSubmit)}
                      disabled={isSaving || isUploading || updateProfile.isPending || !isDirty}
                      className="transition-all duration-200 hover:scale-105 px-6"
                      size="lg"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isSaving ? "Saving Changes..." : "Save All Changes"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )} */}
        </div>
      </div>

      {/* Lightbox */}
      <UnsavedChangesBar isVisible={isDirty || hasPhotoChanges} onSave={form.handleSubmit(onSubmit)} onReset={() => {}} isSaving={isUploading} />

      {lightboxImage && <Lightbox image={lightboxImage} onClose={() => setLightboxImage(null)} />}
    </div>
  );
}
