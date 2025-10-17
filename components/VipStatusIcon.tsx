import React from 'react';
import { VipIcon } from './icons';
import { isVipActive } from '../utils/vip';
import { useTranslation } from '../i18n';

interface VipStatusIconProps {
    profile: {
        is_vip: boolean;
        vip_until: string | null;
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
