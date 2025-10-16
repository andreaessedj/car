import React from 'react';

export const XMarkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

export const MapPinIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
);

export const LocationMarkerIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
      <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.1.4-.27.61-.473a10.764 10.764 0 002.639-2.288 10.94 10.94 0 002.084-3.555A9.006 9.006 0 0017 8c0-4.418-4.03-8-9-8S-2 3.582-2 8c0 1.566.447 3.033 1.232 4.291.845 1.328 1.902 2.525 3.088 3.555a10.94 10.94 0 002.084 2.288 10.764 10.764 0 002.639 1.473c.21.203.424.373.61.473.097.07.193.12.28.14l.018.008.006.003zM10 11.25a3.25 3.25 0 100-6.5 3.25 3.25 0 000 6.5z" clipRule="evenodd" />
    </svg>
);


export const UserIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
);

export const UsersIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-4.663m-5.275 5.275a3.375 3.375 0 00-3.375-3.375M12 12.75a3.375 3.375 0 013.375 3.375m-3.375-3.375a3.375 3.375 0 00-3.375 3.375M12 12.75v-1.5a2.625 2.625 0 00-2.625-2.625M12 12.75v-1.5a2.625 2.625 0 012.625-2.625m0 0A2.625 2.625 0 0112 5.625v-1.5a2.625 2.625 0 00-2.625-2.625m2.625 2.625c.622 0 1.125.503 1.125 1.125v1.5c0 .622-.503 1.125-1.125 1.125m-2.625-2.625c-.622 0-1.125.503-1.125 1.125v1.5c0 .622.503 1.125 1.125 1.125m0 0a2.625 2.625 0 002.625 2.625m-2.625-2.625a2.625 2.625 0 01-2.625 2.625m0 0A2.625 2.625 0 015.625 12v-1.5a2.625 2.625 0 00-2.625-2.625m0 0A2.625 2.625 0 01.375 12v-1.5a2.625 2.625 0 012.625-2.625m16.5 0a2.625 2.625 0 00-2.625 2.625v1.5a2.625 2.625 0 002.625 2.625m0 0A2.625 2.625 0 0118.375 12v-1.5a2.625 2.625 0 00-2.625-2.625" />
    </svg>
);


export const UserCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);


export const PaperAirplaneIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
  </svg>
);

export const ArrowTopRightOnSquareIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-4.5 0V6M13.5 6h4.5m-4.5 0l-7.5 7.5" />
    </svg>
);

export const MagnifyingGlassIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
);

export const ArrowLeftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
    </svg>
);


// Gender/Status Icons for Map
export const MaleIcon: React.FC<{ color?: string }> = ({ color = 'currentColor' }) => (
  <svg viewBox="0 0 24 24" fill={color} className="w-full h-full">
    <path d="M12,9.5A2.5,2.5 0 0,1 14.5,12A2.5,2.5 0 0,1 12,14.5A2.5,2.5 0 0,1 9.5,12A2.5,2.5 0 0,1 12,9.5M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M19,3.5L14.5,8L16,9.5L20.5,5V3.5H19Z" />
  </svg>
);

export const FemaleIcon: React.FC<{ color?: string }> = ({ color = 'currentColor' }) => (
  <svg viewBox="0 0 24 24" fill={color} className="w-full h-full">
    <path d="M12,4A6,6 0 0,1 18,10C18,12.97 15.84,15.44 13,15.92V18H15V20H13V22H11V20H9V18H11V15.92C8.16,15.44 6,12.97 6,10A6,6 0 0,1 12,4M12,6A4,4 0 0,0 8,10A4,4 0 0,0 12,14A4,4 0 0,0 16,10A4,4 0 0,0 12,6Z" />
  </svg>
);

export const TransgenderIcon: React.FC<{ color?: string }> = ({ color = 'currentColor' }) => (
  <svg viewBox="0 0 24 24" fill={color} className="w-full h-full">
    <path d="M12,4C14.76,4 17,6.24 17,9C17,11.76 14.76,14 12,14C9.24,14 7,11.76 7,9C7,6.24 9.24,4 12,4M17.5,15.5L15.5,17.5L13,15V22H11V15L8.5,17.5L6.5,15.5L11,11H13L17.5,15.5M6,6V2H8V6L10.5,3.5L12,5L9,8H5V6H6Z" />
  </svg>
);

export const CoupleIcon: React.FC<{ color?: string }> = ({ color = 'currentColor' }) => (
  <svg viewBox="0 0 24 24" fill={color} className="w-full h-full">
    <path d="M11,4C8.79,4 7,5.79 7,8C7,10.21 8.79,12 11,12C13.21,12 15,10.21 15,8C15,5.79 13.21,4 11,4M11,14C8.33,14 3,15.33 3,18V20H19V18C19,15.33 13.67,14 11,14M16.83,11.53C16.92,11.69 17,11.84 17,12C17,14.21 15.21,16 13,16C12.84,16 12.69,15.92 12.53,15.83C13.5,15.42 14.2,14.5 14.2,13.33C14.2,12.16 13.5,11.25 12.53,10.83C12.69,10.92 12.84,11 13,11C14.5,11 15.8,11.2 16.83,11.53M13,2C15.21,2 17,3.79 17,6C17,8.21 15.21,10 13,10C12.84,10 12.69,10.08 12.53,10.17C13.5,9.75 14.2,8.84 14.2,7.67C14.2,6.5 13.5,5.58 12.53,5.17C12.69,5.08 12.84,5 13,5C13.5,5 13.9,5.08 14.2,5.2V3.83C13.8,3.7 13.4,3.67 13,3.67C11.5,3.67 10.2,3.88 9.17,4.2C9.58,4.5 9.8,5 9.8,5.67C9.8,6.84 9.1,7.75 8.17,8.17C8.08,8.31 8,8.46 8,8.67C8,9.75 8.5,10.67 9.17,11.17C9.08,11.31 9,11.46 9,11.67C9,12.75 9.5,13.67 10.17,14.17C10.58,13.5 11.2,13 12,12.67V12.5C11.6,12.38 11.3,12.2 11.17,12C10.5,11.5 10.1,10.6 10.1,9.67C10.1,8.67 10.5,7.8 11.17,7.29C11.5,7.08 11.8,6.92 12.17,6.83V6.67C11.8,6.58 11.5,6.42 11.17,6.29C10.5,5.8 10.1,4.88 10.1,3.83C10.1,2.83 10.5,2 11.17,1.46C11.8,1.17 12.3,1 13,1C13.33,1 13.67,1.08 14,1.17V2.5C13.7,2.38 13.3,2.33 13,2.33Z" />
  </svg>
);