import React, { useState } from "react";
import { FaFacebook, FaInstagram, FaLinkedin, FaYoutube } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import './UserProfileForm.css';
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
  initialProfile: UserProfileData;
  onSubmit: (values: UserProfileData) => void;
}

export default function UserProfileForm({ initialProfile, onSubmit }: UserProfileFormProps) {
  const [profile, setProfile] = useState<UserProfileData>({
    ...initialProfile,
    photoFile: null,
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
    updateField("photoFile", file);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => updateField("photo", reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(profile);
  };

  return (
    <form onSubmit={handleSubmit} className="profile-form">
        <button type="submit" className="btn dashboard-btn">Save Profile</button>
      {/* Photo Upload */}
      <div className="form-group">
        <label>Profile Photo</label>
        <input type="file" accept="image/*" onChange={handleFileUpload} />

        {profile.photo && (
          <img
            src={profile.photo}
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