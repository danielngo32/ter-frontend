export const getBaseHostname = () => {
  if (typeof window === 'undefined') return null;
  
  const frontendUrl = process.env.REACT_APP_FRONTEND_URL;
  if (!frontendUrl) return null;
  
  try {
    const url = new URL(frontendUrl);
    let hostname = url.hostname.toLowerCase();
    // Remove www prefix
    if (hostname.startsWith('www.')) {
      hostname = hostname.substring(4);
    }
    return hostname;
  } catch {
    return null;
  }
};

export const getSubdomain = () => {
  if (typeof window === 'undefined') return null;
  
  let hostname = window.location.hostname.toLowerCase();
  // Remove www prefix
  if (hostname.startsWith('www.')) {
    hostname = hostname.substring(4);
  }
  const hostnameWithoutPort = hostname.split(':')[0];
  const baseHostname = getBaseHostname();
  
  if (!baseHostname) {
    if (!hostnameWithoutPort.includes('.')) {
      return null;
    }
    const parts = hostnameWithoutPort.split('.');
    if (parts.length >= 2) {
      // Don't treat 'www' as subdomain
      if (parts[0] === 'www') {
        return null;
      }
      return parts[0];
    }
    return null;
  }
  
  if (hostnameWithoutPort === baseHostname) {
    return null;
  }
  
  if (hostnameWithoutPort.endsWith(`.${baseHostname}`)) {
    const subdomain = hostnameWithoutPort.replace(`.${baseHostname}`, '');
    // Don't treat 'www' as subdomain
    if (subdomain === 'www') {
      return null;
    }
    return subdomain || null;
  }
  
  return null;
};

export const isMainDomain = () => {
  if (typeof window === 'undefined') return false;
  
  let hostname = window.location.hostname.toLowerCase();
  // Remove www prefix
  if (hostname.startsWith('www.')) {
    hostname = hostname.substring(4);
  }
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

export const buildSubdomainUrl = (slug, path = '', includeAuth = false) => {
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
    let baseHostname = url.hostname.toLowerCase();
    // Remove www prefix
    if (baseHostname.startsWith('www.')) {
      baseHostname = baseHostname.substring(4);
    }
    
    const subdomainHost = `${slug}.${baseHostname}${port}`;
    const normalizedPath = path ? (path.startsWith('/') ? path : `/${path}`) : '';
    
    let finalUrl = `${protocol}//${subdomainHost}${normalizedPath}`;
    
    // If includeAuth is true, add user info to URL hash for localStorage sync
    if (includeAuth && typeof window !== 'undefined') {
      const user = localStorage.getItem('user');
      const tenantSlug = localStorage.getItem('tenantSlug');
      if (user || tenantSlug) {
        const authData = {
          user: user ? JSON.parse(user) : null,
          tenantSlug: tenantSlug || null,
        };
        // Use hash instead of query to avoid exposing in server logs
        finalUrl += `#auth=${encodeURIComponent(JSON.stringify(authData))}`;
      }
    }
    
    return finalUrl;
  } catch (error) {
    throw new Error(`Invalid REACT_APP_FRONTEND_URL: ${frontendUrl}`);
  }
};

