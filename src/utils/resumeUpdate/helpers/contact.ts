export function isPlaceholderContact(contact: any) {
  if (!contact) return true;
  return (
    !contact.email ||
    contact.email.includes('example.com') ||
    !contact.phone ||
    contact.phone === '050-1234567' ||
    !contact.location ||
    contact.location === 'תל אביב'
  );
}
