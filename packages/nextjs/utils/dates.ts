// Useful functions to unify date format in this app

// From timestamp to date string
export const toDateString = (ts: any) => {
    const newDate = new Date(Number(ts) * 1000);
    const newDateString = newDate.toISOString();
    return newDateString.replaceAll('T', ' ').substring(0, 16);
}
