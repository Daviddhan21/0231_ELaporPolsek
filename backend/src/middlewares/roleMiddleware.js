export const requireOfficer = (req, res, next) => {
  if (!req.user || req.user.role !== 'OFFICER') {
    return res.status(403).json({
      success: false,
      message: 'Akses ditolak. Khusus Anggota Polsek Prambanan (OFFICER).'
    });
  }
  next();
};
