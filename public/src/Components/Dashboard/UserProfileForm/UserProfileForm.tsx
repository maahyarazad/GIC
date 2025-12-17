import React, { useState, useCallback, useEffect } from "react";
import { FaFacebook, FaInstagram, FaLinkedin, FaYoutube } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

import './UserProfileForm.css';
import { UpdateUserRequest, SocialLink } from "../../../../../src/types/user.types";
import { updateUserProfile, uploadUserPhoto, checkNewsLetter } from "../../../api/user";

const ICON_MAP = {
    facebook: FaFacebook,
    instagram: FaInstagram,
    linkedin: FaLinkedin,
    youtube: FaYoutube,
    x: FaXTwitter,
};

// Types
interface UserProfileData {
    photo?: string;
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

    const fetchNewsletterStatus = useCallback(async ()=>{
        try{
            const res = await checkNewsLetter(initialProfile.email);
            if(res.success){
                SetNewsletterSubscription(res.data);
            }

        }catch(err){
            console.error(err)
        }
        

    }, [])

    useEffect(()=>{
        fetchNewsletterStatus();
    }, [fetchNewsletterStatus])



    const handleSubscriptionChange = () =>{
        
    }


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
                name: initialProfile.name,
                email: initialProfile.email,
                authorize: initialProfile.authorize,

                profile: {
                    photo: profile.photo,
                    title: profile.title,
                    description: profile.description,
                    socialLinks: socialLinksArray,
                },
            };

            const response = await updateUserProfile(initialProfile.id, payload);
            if (photoFile) {

                
                const _response = await uploadUserPhoto(initialProfile.id, profile.photoFile!);
            }

            // if (response.success) {
            //   show({ type: "success", message: response.message });

            // }
        } catch (err: any) {
            
            // show({ type: "error", message: err.message });
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
                    type="checkbox"             // fix input type (no dash)
                    checked={newsletterSubscription?.active || false} // fallback to false
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