import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { AuthLayout } from '@/components/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2, Mail, Lock, User, Phone, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

const BUSINESS_TYPES = ['Grocery', 'Electronics', 'Fashion', 'Food & Beverage', 'Health & Beauty', 'Other'];

const glassInput = cn(
  'h-12 rounded-full pl-11 bg-white/20 border-white/30 text-white placeholder:text-white/60',
  'focus-visible:ring-white/60 focus-visible:ring-offset-0'
);
const glassField = cn(
  'h-12 rounded-full bg-white/20 border-white/30 text-white placeholder:text-white/60',
  'focus-visible:ring-white/60 focus-visible:ring-offset-0'
);

const RetailerRegister = () => {
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: '',
    ownerName: '',
    email: '',
    phone: '',
    password: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    description: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await register(formData.ownerName, formData.email, formData.password, {
        type: 'retailer',
        businessName: formData.businessName,
        businessType: formData.businessType,
        phone: formData.phone,
        street: formData.street,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        description: formData.description,
      });
      navigate('/verify-otp', { state: { email: formData.email } });
    } catch (error) {
      // Error already toasted by register()
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <AuthLayout
      wide
      heading="Sign Up"
      tagline="Join Bailord Pulse's retailer network — manage orders, track projects, and grow your business."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70" />
            <Input
              id="businessName"
              name="businessName"
              type="text"
              placeholder="Business Name"
              value={formData.businessName}
              onChange={handleInputChange}
              className={glassInput}
              required
            />
          </div>

          <Select
            value={formData.businessType}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, businessType: value }))}
          >
            <SelectTrigger id="businessType" className={glassField}>
              <SelectValue placeholder="Business Type" />
            </SelectTrigger>
            <SelectContent>
              {BUSINESS_TYPES.map((type) => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70" />
            <Input
              id="ownerName"
              name="ownerName"
              type="text"
              placeholder="Owner's Full Name"
              value={formData.ownerName}
              onChange={handleInputChange}
              className={glassInput}
              required
            />
          </div>

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70" />
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleInputChange}
              className={glassInput}
              required
            />
          </div>

          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70" />
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={handleInputChange}
              className={glassInput}
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70" />
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              className={glassInput}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative md:col-span-2">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70" />
            <Input
              id="street"
              name="street"
              type="text"
              placeholder="Street address"
              value={formData.street}
              onChange={handleInputChange}
              className={glassInput}
              required
            />
          </div>
          <Input
            id="city"
            name="city"
            type="text"
            placeholder="City"
            value={formData.city}
            onChange={handleInputChange}
            className={glassField}
            required
          />
          <Input
            id="state"
            name="state"
            type="text"
            placeholder="State"
            value={formData.state}
            onChange={handleInputChange}
            className={glassField}
            required
          />
          <Input
            id="zipCode"
            name="zipCode"
            type="text"
            placeholder="ZIP Code"
            value={formData.zipCode}
            onChange={handleInputChange}
            className={cn(glassField, 'md:col-span-2')}
            required
          />
        </div>

        <Textarea
          id="description"
          name="description"
          placeholder="Tell us about your business, products, and services..."
          value={formData.description}
          onChange={handleInputChange}
          className="min-h-[100px] rounded-2xl bg-white/20 border-white/30 text-white placeholder:text-white/60 focus-visible:ring-white/60 focus-visible:ring-offset-0"
          required
        />

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 rounded-full bg-white text-primary font-semibold hover:bg-white/90"
        >
          {isLoading ? 'Submitting application...' : 'Register'}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-white/70">
        Already a registered retailer?{' '}
        <Link to="/login" className="text-white font-medium underline underline-offset-2 hover:text-white/90">
          Sign In
        </Link>
      </p>
    </AuthLayout>
  );
};

export default RetailerRegister;
