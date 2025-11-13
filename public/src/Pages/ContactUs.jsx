import ContactUsForm from '../Components/ContactUsForm/ContactUsForm'
import BackgroundContact from '../Assets/pexels-aloevera-18820840.jpg'
const ContactUs = ({siteData}) => 

<div style={{
                            backgroundImage: `url(${BackgroundContact})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat'
                        }}>

<ContactUsForm siteData={siteData.ContactUs}/>
</div>

export default ContactUs;
