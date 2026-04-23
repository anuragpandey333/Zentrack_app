import { useState } from 'react';
import { User } from 'lucide-react';

const Avatar = ({ src, alt = 'User', size = 'md', className = '' }) => {
    const [imageError, setImageError] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

    const sizeClasses = {
        xs: 'w-6 h-6 text-xs',
        sm: 'w-8 h-8 text-sm',
        md: 'w-10 h-10 text-base',
        lg: 'w-12 h-12 text-lg',
        xl: 'w-16 h-16 text-xl',
        '2xl': 'w-24 h-24 text-2xl',
        '3xl': 'w-32 h-32 text-3xl'
    };

    const handleImageError = () => {
        setImageError(true);
    };

    const handleImageLoad = () => {
        setImageLoaded(true);
    };

    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    if (!src || imageError) {
        return (
            <div className={`${sizeClasses[size]} ${className} rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold`}>
                {alt ? getInitials(alt) : <User className="w-1/2 h-1/2" />}
            </div>
        );
    }

    return (
        <div className={`${sizeClasses[size]} ${className} rounded-full overflow-hidden bg-slate-200 relative`}>
            {!imageLoaded && (
                <div className="absolute inset-0 bg-slate-200 animate-pulse" />
            )}
            <img
                src={src}
                alt={alt}
                onError={handleImageError}
                onLoad={handleImageLoad}
                className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                loading="lazy"
            />
        </div>
    );
};

export default Avatar;
