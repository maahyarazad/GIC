import React, { useState, useCallback, useEffect, useContext } from "react";
import { FaFacebook, FaInstagram, FaLinkedin, FaYoutube } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

import './UserProfileForm.css';
import { UpdateUserRequest, SocialLink } from "../../../../../src/types/user.types";
import { updateUserProfile, uploadUserPhoto, checkNewsLetter, getUserProfile, upsertNewsletterSubscriber, getPDFBlob } from "../../../api/user";
import { useToast } from "@/providers/ToastContext";
import { EnvContext } from '@/EnvContext';
import axiosInstance from '../../../api/axiosInstance';
// Helper to convert socialLinks array to object keyed by type
function socialLinksArrayToObject(
    arr: { platform: string; url: string }[] = []
): Record<string, string> {
    return arr.reduce((acc, link) => {
        if (link.platform && link.url) {
            acc[link.platform] = link.url;
        }
        return acc;
    }, {} as Record<string, string>);
}


const ICON_MAP = {
    facebook: FaFacebook,
    instagram: FaInstagram,
    linkedin: FaLinkedin,
    youtube: FaYoutube,
    x: FaXTwitter,
};

// Types
interface UserProfileData {
    id: string;
    name: string;
    email: string;
    photo?: string;
    phone?: string;
    authorize: boolean;
    photoFile?: File | null;
    title?: string;
    description?: string;
    socialLinks?: {
        facebook?: string;
        instagram?: string;
        linkedin?: string;
        youtube?: string;
        x?: string;
    };
}

interface UserProfileFormProps {
    initialProfile: any;
    // onSubmit: (values: UserProfileData) => void;
}

export default function UserProfileForm({ initialProfile }: any) {


    const env = useContext(EnvContext);
    const { show } = useToast();
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [newsletterSubscription, SetNewsletterSubscription] = useState<object | null>(null);
    const [profile, setProfile] = useState<UserProfileData>({
        ...initialProfile,

        socialLinks: {
            facebook: initialProfile.socialLinks?.facebook || "",
            instagram: initialProfile.socialLinks?.instagram || "",
            linkedin: initialProfile.socialLinks?.linkedin || "",
            youtube: initialProfile.socialLinks?.youtube || "",
            x: initialProfile.socialLinks?.x || "",
        },
    });

    const fetchUserProfile = useCallback(async () => {
        try {
            if (!initialProfile) return;

            const res = await getUserProfile(initialProfile._id || initialProfile.id);


            if (res.success) {
                const user = res.data.user;
                setProfile({
                    id: user._id,
                    photo: user.profile?.photo,
                    authorize: user.authorize,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    title: user.profile?.title || "",
                    description: user.profile?.description || "",
                    socialLinks: socialLinksArrayToObject(user.profile?.socialLinks),
                });

                if (user.profile?.photo) {
                    setPhotoPreview(`${env.VITE_SERVER_API_URL}${user.profile.photo}`);
                }

            }

        } catch (err) {
            console.error(err)
        }


    }, [])

    useEffect(() => {
        fetchUserProfile();
    }, [fetchUserProfile])




    const updateField = (field: keyof UserProfileData, value: any) => {
        setProfile({ ...profile, [field]: value });
    };

    const updateSocialField = (platform: string, value: string) => {
        setProfile({
            ...profile,
            socialLinks: {
                ...profile.socialLinks,
                [platform]: value,
            },
        });
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setPhotoFile(file);

        if (file) {
            const reader = new FileReader();

            reader.onload = () => setPhotoPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const fetchNewsletterStatus = useCallback(async () => {
        try {
            const res = await checkNewsLetter(profile.email);
            if (res.success) {
                SetNewsletterSubscription(res.data);
            }

        } catch (err) {
            console.error(err)
        }


    }, [])

    useEffect(() => {
        fetchNewsletterStatus();
    }, [fetchNewsletterStatus])




    const handleSubscriptionChange = async (e) => {
        try {

            const res = await upsertNewsletterSubscriber(profile.email, { active: e.target.checked });

            if (res.success) {
                show({ type: "success", message: res.message });
                fetchNewsletterStatus();
            }
        } catch (err) {
            console.error(err);
            show({ type: "error", message: err });
        }
    };



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {

            const socialLinksArray: SocialLink[] = Object.entries(profile.socialLinks || {})
                .filter(([_, url]) => url.trim() !== "")
                .map(([platform, url]) => ({
                    platform,
                    url
                }));

            // Build final payload strictly matching UpdateUserRequest
            const payload: UpdateUserRequest = {
                name: profile.name,
                email: profile.email,
                authorize: profile.authorize,

                profile: {
                    photo: profile.photo,
                    title: profile.title,
                    description: profile.description,
                    socialLinks: socialLinksArray,
                },
            };

            const response = await updateUserProfile(profile.id, payload);
            if (photoFile) {
                const _response = await uploadUserPhoto(profile.id, photoFile);
                if (!_response.success) {
                    show({ type: "error", message: _response.message });
                    return; // optionally stop if upload failed
                }
            }


            if (response.success) {

                show({ type: "success", message: response.message });

            }
        } catch (err: any) {
            console.error(err);
            show({ type: "error", message: err.message });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="profile-form">
           
            <button type="submit" className="btn dashboard-btn">Save Profile</button>
            <div className="form-group">

                <div className="d-lg-flex mb-2">
                    <div className="form-group flex-grow-1 me-lg-2">

                        <label>Email</label>
                        <input
                            className="disabled"
                            type="text"
                            value={profile.email || ""}
                            disabled
                        />
                    </div>
                    <div className="form-group flex-grow-1 mt-3 mt-lg-0">
                        <label>Phone Number</label>
                        <input
                            className="disabled"
                            type="text"
                            value={profile.phone || ""}
                            disabled
                        />
                    </div>

                </div>
            </div>
            <div className="form-group">

                <div className="d-lg-flex mb-2">
                    <div className="form-group flex-grow-1 me-lg-2">

                        <label>Fullname</label>
                        <input

                            type="text"
                            value={profile.name || ""}
                            onChange={(e) => updateField("name", e.target.value)}
                        />
                    </div>


                </div>
            </div>
            {/* Photo Upload */}
            <div className="form-group">
                <label>Profile Photo</label>
                <input type="file" accept="image/*" onChange={handleFileUpload} />

                {photoPreview && (
                    <img
                        src={photoPreview}
                        alt="Preview"
                        className="preview-image"
                    />
                )}
            </div>

            {/* Title */}
            <div className="form-group">
                <label>Title</label>
                <input
                    type="text"
                    value={profile.title || ""}
                    onChange={(e) => updateField("title", e.target.value)}
                />
            </div>

            <div className="form-group">
                <div className="d-flex align-items-center">

                    <label className="pe-1 m-0">
                        Newsletter Subscription
                    </label >
                    <input className=""
                        type="checkbox"
                        checked={newsletterSubscription?.active}
                        onChange={handleSubscriptionChange}
                    />
                </div>
            </div>

            {/* Description */}
            <div className="form-group">
                <label>Description / Bio</label>
                <textarea
                    value={profile.description || ""}
                    onChange={(e) => updateField("description", e.target.value)}
                />
            </div>

            {/* Static Social Links */}
            <div className="form-group">
                <label>Social Links</label>

                {Object.entries(ICON_MAP).map(([platform, Icon]) => (
                    <div key={platform} className="social-link-row">
                        <div className="icon-preview">
                            {React.createElement(Icon)}
                        </div>

                        <input
                            type="text"
                            placeholder={`Enter ${platform} profile URL`}
                            value={profile.socialLinks?.[platform as keyof typeof profile.socialLinks] || ""}
                            onChange={(e) => updateSocialField(platform, e.target.value)}
                        />
                    </div>
                ))}
            </div>


        </form>
    );
}