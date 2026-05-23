import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { getUsers } from '@/utils/storage';
import { loginUser as apiLoginUser } from '@/lib/api';
import { ArrowLeft } from 'lucide-react';
import Beams from '../components/Background';
import Navbar from '../components/Navbar';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();
  const logoUrl = "https://horizons-cdn.hostinger.com/a6afdcf9-aaa7-4281-ba79-be0f31c772d0/384adb0a13bc13709264589f14f2ae52.jpg";

  const [formData, setFormData] = useState({
    aadhaar: '',
    password: ''
  });

  const formatAadhaar = (digits) => {
    if (!digits) return '';
    return digits.match(/.{1,4}/g)?.join(' ') ?? digits;
  };

  const handleAadhaarChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 12);
    setFormData((s) => ({ ...s, aadhaar: digits }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { user, token } = await apiLoginUser({
        aadhaar: formData.aadhaar,
        password: formData.password,
      });

      login(user, token);
      toast({
        title: "Welcome back! 🎉",
        description: `Logged in as ${user.name}`
      });
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (error) {
      const users = getUsers();
      const user = users.find(u => u.aadhaar === formData.aadhaar && u.password === formData.password);

      if (user) {
        login(user);
        toast({
          title: "Welcome back! 🎉",
          description: `Logged in as ${user.name}`
        });
        navigate(user.role === 'admin' ? '/admin' : '/dashboard');
        return;
      }

      toast({
        title: "Login failed",
        description: error.message || "Invalid Aadhaar or password",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <Helmet>
        <title>Login - CITIFIX</title>
        <meta name="description" content="Login to your CITIFIX account to report issues and track resolutions." />
      </Helmet>
      
     <div className="relative min-h-screen flex items-center  pt-24 justify-center p-4 bg-black text-black overflow-hidden">

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
<Navbar/>

  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="relative z-10 w-full max-w-md"
  >
    <div className="bg-gradient-to-r from-white/20 to-white/30 rounded-3xl shadow-[0_30px_80px_-30px_rgba(255,255,255,0.25)] 
      p-8 border border-black/10">

      
      <div className="flex items-center justify-center gap-2 mb-8">
        <img src={logoUrl} alt="CITIFIX Logo" className="w-10 h-10 rounded-lg" />
        <span className="text-2xl font-bold tracking-wide text-white/90">
          CITIFIX
        </span>
      </div>


      <h2 className="text-3xl font-bold text-white text-center mb-2">
        Welcome Back
      </h2>
      <p className="text-gray-300 text-center mb-8">
        Login to continue
      </p>

   
      <form onSubmit={handleSubmit} className="space-y-6">

        <div>
          <Label htmlFor="aadhaar" className="text-white">
            Aadhaar Number
          </Label>
          <Input
            id="aadhaar"
            type="text"
            placeholder="XXXX XXXX XXXX"
            value={formatAadhaar(formData.aadhaar)}
            onChange={handleAadhaarChange}
            required
            maxLength={14}
            className="bg-white text-black border-black/20 
              placeholder:text-gray-400 focus:border-black focus:ring-black/10"
            inputMode="numeric"
          />
        </div>

        <div>
          <Label htmlFor="password" className="text-white">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            className="bg-white text-black border-black/20 
              placeholder:text-gray-400 focus:border-black focus:ring-black/10"
          />
        </div>


        <Button type="submit" className="w-full hover:bg-white/70 hover:text-black bg-black text-white">
          Login
        </Button>
      </form>

  
      <p className="text-center mt-6 text-sm text-white">
        Don't have an account?{" "}
        <button
          onClick={() => navigate('/register')}
          className="text-white text-sm font-semibold hover:underline"
        >
          Register
        </button>
      </p>

    </div>
  </motion.div>
</div>

    </>
  );
};

export default LoginPage;
