const portfolioListItemDTO = (portfolio) => {
  if (!portfolio) return null;
  return {
    id: portfolio._id,
    userId: portfolio.userId,
    templateId: portfolio.templateId,
    title: portfolio.title,
    portfolioType: portfolio.portfolioType,
    status: portfolio.status,
    fullName: portfolio.personal?.fullName || '',
    zipPath: portfolio.zipPath,
    generatedAt: portfolio.generatedAt,
    createdAt: portfolio.createdAt,
    updatedAt: portfolio.updatedAt
  };
};

const portfolioDetailDTO = (portfolio) => {
  if (!portfolio) return null;
  return {
    id: portfolio._id,
    userId: portfolio.userId,
    templateId: portfolio.templateId,
    title: portfolio.title,
    portfolioType: portfolio.portfolioType,
    personal: {
      fullName: portfolio.personal?.fullName || '',
      title: portfolio.personal?.title || '',
      profileImage: portfolio.personal?.profileImage || '',
      bio: portfolio.personal?.bio || '',
      location: portfolio.personal?.location || '',
      email: portfolio.personal?.email || '',
      phone: portfolio.personal?.phone || '',
      website: portfolio.personal?.website || ''
    },
    socialLinks: {
      github: portfolio.socialLinks?.github || '',
      linkedin: portfolio.socialLinks?.linkedin || '',
      twitter: portfolio.socialLinks?.twitter || '',
      instagram: portfolio.socialLinks?.instagram || '',
      facebook: portfolio.socialLinks?.facebook || ''
    },
    skills: portfolio.skills || [],
    experience: (portfolio.experience || []).map(exp => ({
      id: exp._id,
      company: exp.company,
      position: exp.position,
      startDate: exp.startDate,
      endDate: exp.endDate,
      description: exp.description
    })),
    education: (portfolio.education || []).map(edu => ({
      id: edu._id,
      institution: edu.institution,
      degree: edu.degree,
      year: edu.year,
      description: edu.description
    })),
    projects: (portfolio.projects || []).map(proj => ({
      id: proj._id,
      name: proj.name,
      image: proj.image,
      description: proj.description,
      technologies: proj.technologies || [],
      githubLink: proj.githubLink || '',
      liveDemo: proj.liveDemo || ''
    })),
    certificates: (portfolio.certificates || []).map(cert => ({
      id: cert._id,
      name: cert.name,
      organization: cert.organization,
      date: cert.date,
      verificationLink: cert.verificationLink || ''
    })),
    additionalInfo: {
      achievements: portfolio.additionalInfo?.achievements || [],
      languages: portfolio.additionalInfo?.languages || [],
      interests: portfolio.additionalInfo?.interests || [],
      hobbies: portfolio.additionalInfo?.hobbies || []
    },
    status: portfolio.status,
    zipPath: portfolio.zipPath,
    generatedAt: portfolio.generatedAt,
    createdAt: portfolio.createdAt,
    updatedAt: portfolio.updatedAt
  };
};

module.exports = {
  portfolioListItemDTO,
  portfolioDetailDTO
};
