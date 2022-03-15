# Nginx ingress using the defined DNS name. Creates AWS hosted zone and certificates automatically.
# Does NOT register a domain or create a hosted zone if the DNS name is a subdomain.

resource "aws_route53_zone" "ingress" {
  name  = var.ingress_domain
}

# Create NS record for the "ingress" zone in the parent zone
# The parent zone is not managed by terraform
data "aws_route53_zone" "parent" {
  name  = replace(var.ingress_domain, "/^[\\w-]+\\./", "")
}

resource "aws_route53_record" "parent_ns_records" {
  # Only create parent NS records if the DNS name is a subdomain

  allow_overwrite = true
  name            = var.ingress_domain
  records         = aws_route53_zone.ingress.name_servers
  ttl             = 60
  type            = "NS"
  zone_id         = data.aws_route53_zone.parent.zone_id
}

module "ingress_certificate" {
  source  = "terraform-aws-modules/acm/aws"
  version = "~> v2.0"

  domain_name = "*.${var.ingress_domain}"
  zone_id     = aws_route53_zone.ingress.id

  subject_alternative_names = [
    var.ingress_domain,
  ]

  wait_for_validation = true
}