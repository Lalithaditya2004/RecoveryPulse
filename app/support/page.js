export default function Support() {
  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-12 text-center">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">Contact Support</h1>
        <p className="text-slate-600 mb-8">
          Need help setting up your integrations or have a question about your account? We are here to help.
        </p>
        
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 mb-8 text-left">
          <h3 className="font-semibold text-indigo-900 mb-2">Email Us</h3>
          <p className="text-indigo-700 mb-4 text-sm">
            For technical support, billing inquiries, or general questions, please reach out to our team directly. We aim to respond within 24 hours.
          </p>
          <a 
            href="mailto:lalithadityakaja@gmail.com" 
            className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Email Support
          </a>
        </div>
      </div>
    </div>
  );
}