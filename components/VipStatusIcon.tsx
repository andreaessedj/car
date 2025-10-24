import React from 'react';
import { VipIcon } from './icons';
import { isVipActive } from '../utils/vip';
import { useTranslation } from '../i18n';

// FIX: Loosen type of profile prop to allow optional is_vip and vip_until properties to be compatible with Venue type.
interface VipStatusIconProps {
    profile: {
        is_vip?: boolean;
        vip_until?: string | null;
    } | null;
    className?: string;
}

const VipStatusIcon: React.FC<VipStatusIconProps> = ({ profile, className }) => {
    const { t } = useTranslation();

    if (!profile?.is_vip) {
        return null;
    }

    const active = isVipActive(profile);
    const title = t(active ? 'vip.active' : 'vip.expired');

    return (
        <VipIcon
            className={`${className} ${active ? 'text-yellow-400' : 'text-gray-500'}`}
            title={title}
        />
    );
};

export default VipStatusIcon;
