import React from 'react';
import { motion } from 'framer-motion';
import styled, { keyframes } from 'styled-components';

const shimmer = keyframes`
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
`;

const LoadingContainer = styled(motion.div)`
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f7f9fb;
  z-index: 9999;
  padding: 20px;

  @media (max-width: 768px) {
    padding: 16px;
  }

  @media (max-width: 480px) {
    padding: 12px;
  }
`;

const SpinnerWrapper = styled(motion.div)`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 28px;
  align-items: center;
  justify-content: center;
`;

const LoadingCard = styled(motion.div)`
  width: min(320px, 90vw);
  padding: 32px 36px;
  border-radius: 24px;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.06);
  box-shadow:
    0 20px 40px rgba(15, 23, 42, 0.06),
    0 8px 16px rgba(15, 23, 42, 0.04);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;

  @media (max-width: 768px) {
    padding: 28px 32px;
    border-radius: 20px;
    gap: 20px;
  }

  @media (max-width: 480px) {
    padding: 24px 28px;
    border-radius: 16px;
    gap: 18px;
    width: min(300px, 90vw);
  }
`;

const LogoOrbit = styled.div`
  position: relative;
  width: 130px;
  height: 130px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;

  @media (max-width: 768px) {
    width: 110px;
    height: 110px;
  }

  @media (max-width: 480px) {
    width: 90px;
    height: 90px;
  }
`;

const LogoImage = styled(motion.img)`
  width: 85px;
  height: 85px;
  object-fit: contain;

  @media (max-width: 768px) {
    width: 70px;
    height: 70px;
  }

  @media (max-width: 480px) {
    width: 60px;
    height: 60px;
  }
`;

const ProgressTrack = styled.div`
  position: relative;
  width: 180px;
  height: 4px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.08);
  overflow: hidden;

  @media (max-width: 768px) {
    width: 160px;
  }

  @media (max-width: 480px) {
    width: 140px;
    height: 3px;
  }
`;

const ProgressFill = styled.div`
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(90deg, #1a237e 0%, #283593 50%, #3949ab 100%);
  animation: ${shimmer} 1.4s ease-in-out infinite;
`;

const LoadingText = styled.div`
  font-size: clamp(22px, 4vw, 28px);
  font-weight: 600;
  color: #0f172a;
  text-align: center;

  @media (max-width: 768px) {
    font-size: clamp(20px, 4vw, 24px);
  }

  @media (max-width: 480px) {
    font-size: clamp(18px, 4vw, 22px);
  }
`;

const SubText = styled.div`
  font-size: 14px;
  color: #475569;
  text-align: center;
  max-width: 360px;
  line-height: 1.5;

  @media (max-width: 768px) {
    font-size: 13px;
    max-width: 320px;
  }

  @media (max-width: 480px) {
    font-size: 12px;
    max-width: 280px;
    line-height: 1.4;
  }
`;

const LoadingSpinner = ({ text = 'Preparing workspace' }) => {
  const containerVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  };

  return (
    <LoadingContainer
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.25 }}
    >
      <SpinnerWrapper>
        <LoadingCard
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <LogoOrbit>
            <LogoImage
              src="/logo/logoicon512.png"
              alt="TER Loader"
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{
                opacity: 1,
                rotate: 360,
                scale: [0.9, 1.04, 0.9],
              }}
              transition={{
                opacity: { duration: 0.4, ease: 'easeOut' },
                rotate: { duration: 4, repeat: Infinity, ease: 'linear' },
                scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
              }}
            />
          </LogoOrbit>

          <ProgressTrack>
            <ProgressFill />
          </ProgressTrack>
        </LoadingCard>

        <LoadingText>{text}</LoadingText>
        <SubText>Loading your personalized TER workspace and keeping everything in perfect sync.</SubText>
      </SpinnerWrapper>
    </LoadingContainer>
  );
};

export default LoadingSpinner;

