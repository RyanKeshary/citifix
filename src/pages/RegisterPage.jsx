import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { saveUser } from '@/utils/storage';
import { registerUser as apiRegisterUser } from '@/lib/api';
import Beams from '../components/Background';
import Navbar from '../components/Navbar';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    aadhaar: '',
    password: '',
    role: 'citizen'
  });
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const logoUrl = "https://horizons-cdn.hostinger.com/a6afdcf9-aaa7-4281-ba79-be0f31c772d0/384adb0a13bc13709264589f14f2ae52.jpg";


  const formatAadhaar = (digits) => {
    if (!digits) return '';
    return digits.match(/.{1,4}/g)?.join(' ') ?? digits;
  };


  const formatPhoneDisplay = (digits) => {
    if (!digits) return '';

    return digits.replace(/(\d{5})(\d{5})?/, (_, a, b) => (b ? `${a} ${b}` : a));
  };

  const handleAadhaarChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 12);
    setFormData((s) => ({ ...s, aadhaar: digits }));
  };

  const handlePhoneChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
    setFormData((s) => ({ ...s, phone: digits }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const mockOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(mockOtp);
    setStep(2);


    toast({
      title: "OTP Sent",
      description: `Mock OTP: ${mockOtp} (for demo)`,
      variant: "default"
    });
  };

  const handleVerifyOtp = async () => {
    if (verifying) return;
    setVerifying(true);
    if (otp === generatedOtp) {
      try {
        const { user, token } = await apiRegisterUser(formData);
        login(user, token);

        toast({
          title: "Registration Successful",
          description: "Welcome to CITIFIX",
          variant: "success"
        });

        setTimeout(() => {
          setVerifying(false);
          navigate(user.role === 'admin' ? '/admin' : '/dashboard');
        }, 300);
      } catch (error) {
        const newUser = saveUser(formData);
        login(newUser);

        toast({
          title: "Registration Successful",
          description: "Saved locally because the backend was unavailable.",
          variant: "success"
        });

        setTimeout(() => {
          setVerifying(false);
          navigate(newUser.role === 'admin' ? '/admin' : '/dashboard');
        }, 300);
      }
    } else {
      setVerifying(false);
      toast({
        title: "Invalid OTP",
        description: "The code you entered is incorrect. Please try again.",
        variant: "destructive"
      });
    }
  };


  useEffect(() => {
    if (step === 2 && generatedOtp && otp.length === 6 && !verifying) {
      handleVerifyOtp();
    }
  }, [otp, step, generatedOtp, verifying]);

  useEffect(() => {
    if (step === 2 && !generatedOtp) {
      const mockOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(mockOtp);
      toast({
        title: "OTP Generated",
        description: `Mock OTP: ${mockOtp} (for demo)`,
        variant: "default"
      });
    }
  }, [step, generatedOtp, toast]);

  return (
    <>
      <Helmet>
        <title>Register - CITIFIX</title>
        <meta name="description" content="Create your CITIFIX account and start reporting civic issues in your community." />
      </Helmet>

      <div className="relative min-h-screen flex items-center pt-32 justify-center p-4 bg-black text-black overflow-hidden">
        <div className="fixed inset-0 z-0">
          <Beams
            beamWidth={2}
            beamHeight={15}
            beamNumber={12}
            lightColor="#ffffff"
            speed={2}
            noiseIntensity={1.75}
            scale={0.2}
            rotation={0}
          />
        </div>

        <Navbar />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 w-full max-w-md"
        >
          <div className="bg-gradient-to-r from-white/20 to-white/30 rounded-3xl shadow-[0_30px_80px_-30px_rgba(255,255,255,0.25)] p-8 border border-black/10">
            <div className="flex items-center justify-center gap-2 mb-6">
              <img src={logoUrl} alt="CITIFIX Logo" className="w-10 h-10 rounded-lg" />
              <span className="text-2xl font-bold tracking-wide text-white/90">
                CITIFIX
              </span>
            </div>

            <h2 className="text-3xl font-bold text-white text-center mb-2">
              {step === 1 ? 'Create Account' : 'Verify Aadhaar'}
            </h2>
            <p className="text-gray-300 text-center mb-6">
              {step === 1 ? 'Join the civic movement' : 'Enter the OTP sent to your phone'}
            </p>

            {step === 1 ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="text-white">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter your name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="bg-white text-black border-black/20 placeholder:text-gray-400 focus:border-black focus:ring-black/10"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-white">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="bg-white text-black border-black/20 placeholder:text-gray-400 focus:border-black focus:ring-black/10"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-white">Phone Number</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 select-none">
                        +91
                      </span>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="XXXXX XXXXX"
                        value={formatPhoneDisplay(formData.phone)}
                        onChange={handlePhoneChange}
                        required
                        className="pl-12 bg-white text-black border-black/20 placeholder:text-gray-400 focus:border-black focus:ring-black/10"
                        inputMode="numeric"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="aadhaar" className="text-white">Aadhaar Number</Label>
                    <Input
                      id="aadhaar"
                      type="text"
                      placeholder="XXXX XXXX XXXX"
                      value={formatAadhaar(formData.aadhaar)}
                      onChange={handleAadhaarChange}
                      required
                      maxLength={14} /* 12 digits + 2 spaces display */
                      className="bg-white text-black border-black/20 placeholder:text-gray-400 focus:border-black focus:ring-black/10"
                      inputMode="numeric"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="password" className="text-white">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    className="bg-white text-black border-black/20 placeholder:text-gray-400 focus:border-black focus:ring-black/10"
                  />
                </div>

                <div>
                  <Label htmlFor="role" className="text-white">Register as</Label>
                  <select
                    id="role"
                    className="w-full px-3 py-2 border rounded-md bg-white text-black border-black/20 focus:border-black focus:ring-black/10"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="citizen">Citizen</option>
                    <option value="admin">Admin (Authority)</option>
                  </select>
                </div>

                <Button type="submit" className="w-full hover:bg-white/70 hover:text-black bg-black text-white">
                  Continue
                </Button>
              </form>
            ) : (
              <div className="space-y-5">
                <div className="space-y-3">
                  <Label className="text-white text-center block">
                    Enter 6-digit OTP
                  </Label>

                  <div className="flex justify-center gap-2">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <input
                        key={index}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={otp[index] || ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/, '');
                          const newOtp = otp.split('');
                          newOtp[index] = value;
                          setOtp(newOtp.join(''));

      
                          if (value) {
                            const next = e.target.nextElementSibling;
                            if (next) next.focus();
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Backspace' && !otp[index]) {
                            const prev = e.target.previousElementSibling;
                            if (prev) prev.focus();
                          }
                        }}
                        className="
                          w-12 h-14 text-center text-xl font-bold
                          rounded-xl
                          bg-white/90 text-black
                          border border-black/20
                          focus:outline-none focus:ring-2 focus:ring-white/50
                          shadow-inner
                        "
                      />
                    ))}
                  </div>

                  <p className="text-sm text-gray-300 text-center">
                    Demo OTP: <span className="font-semibold">{generatedOtp}</span>
                  </p>
                </div>

                {/* Verify button removed — auto-verify runs when 6 digits complete */}
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep(1);
                    setOtp('');
                    setGeneratedOtp('');
                  }}
                  className="w-full bg-white/10 text-white border-white/30 hover:bg-white/20"
                >
                  Back
                </Button>
              </div>
            )}

            <p className="text-center mt-6 text-sm text-white">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-white font-semibold hover:underline"
              >
                Login
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default RegisterPage;