output "outputs" {
  value = {
    zone_id        = aws_route53_zone.ingress.id
    certificate_arn = module.ingress_certificate.this_acm_certificate_arn
  }
}
