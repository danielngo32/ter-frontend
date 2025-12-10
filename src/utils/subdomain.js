export const getBaseHostname = () => {
  if (typeof window === 'undefined') return null;
  
  const frontendUrl = process.env.REACT_APP_FRONTEND_URL;
  if (!frontendUrl) return null;
  
  try {
    const url = new URL(frontendUrl);
    return url.hostname.toLowerCase();
  } catch {
    return null;
  }
};

export const getSubdomain = () => {
  if (typeof window === 'undefined') return null;
  
  const hostname = window.location.hostname.toLowerCase();
  const hostnameWithoutPort = hostname.split(':')[0];
  const baseHostname = getBaseHostname();
  
  if (!baseHostname) {
    if (!hostnameWithoutPort.includes('.')) {
      return null;
    }
    const parts = hostnameWithoutPort.split('.');
    if (parts.length >= 2) {
      return parts[0];
    }
    return null;
  }
  
  if (hostnameWithoutPort === baseHostname) {
    return null;
  }
  
  if (hostnameWithoutPort.endsWith(`.${baseHostname}`)) {
    const subdomain = hostnameWithoutPort.replace(`.${baseHostname}`, '');
    return subdomain || null;
  }
  
  return null;
};

export const isMainDomain = () => {
  if (typeof window === 'undefined') return false;
  
  const hostname = window.location.hostname.toLowerCase();
  const hostnameWithoutPort = hostname.split(':')[0];
  const baseHostname = getBaseHostname();
  
  if (baseHostname) {
    return hostnameWithoutPort === baseHostname;
  }
  
  return !hostnameWithoutPort.includes('.');
};

export const isSubdomain = () => {
  return getSubdomain() !== null;
};

export const buildSubdomainUrl = (slug, path = '') => {
  if (typeof window === 'undefined') return '';
  if (!slug || typeof slug !== 'string') {
    throw new Error('Slug is required');
  }

  const frontendUrl = process.env.REACT_APP_FRONTEND_URL;
  if (!frontendUrl) {
    throw new Error('REACT_APP_FRONTEND_URL is not set');
  }
  
  try {
    const url = new URL(frontendUrl);
    const protocol = url.protocol;
    const port = url.port ? `:${url.port}` : '';
    const baseHostname = url.hostname.toLowerCase();
    
    const subdomainHost = `${slug}.${baseHostname}${port}`;
    const normalizedPath = path ? (path.startsWith('/') ? path : `/${path}`) : '';
    
    return `${protocol}//${subdomainHost}${normalizedPath}`;
  } catch (error) {
    throw new Error(`Invalid REACT_APP_FRONTEND_URL: ${frontendUrl}`);
  }
};

