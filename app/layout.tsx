import "leaflet/dist/leaflet.css";
import "./globals.css";


export default function Layout({ children }: { children: React.ReactNode }) {

 return (
   <html>
      <body>
        {children}
     </body>
    </html>
  )
}